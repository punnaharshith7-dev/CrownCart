import type { Db, Row } from "../db.ts";
import { config, integrations } from "../config.ts";
import { conflict, unavailable } from "./errors.ts";
import { getSetting } from "./settings.ts";
import { restockOrder, transitionOrder, type OrderStatus } from "./orders.ts";
import { audit } from "./audit.ts";

/*
 * Shiprocket courier aggregator. Booking creates a Shiprocket order, assigns an
 * AWB (tracking number), schedules pickup and fetches the label. Tracking
 * arrives by webhook (or a manual sync) and drives the order status.
 */

const BASE = "https://apiv2.shiprocket.in/v1/external";
let token: { value: string; expires: number } | null = null;

async function auth(): Promise<string> {
  if (!integrations().courier) throw unavailable("Courier integration is not configured on this server.");
  if (token && token.expires > Date.now()) return token.value;
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.shiprocket.email, password: config.shiprocket.password }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!res.ok || !data.token) throw new Error(`Shiprocket login failed: ${data.message ?? res.status}`);
  // Tokens last 10 days; refresh well before that.
  token = { value: data.token, expires: Date.now() + 8 * 86_400_000 };
  return token.value;
}

async function call<T>(method: "GET" | "POST", path: string, payload?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await auth()}`, "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (res.status === 401) token = null;
  if (!res.ok) throw new Error(`Shiprocket ${path} failed (${res.status}): ${data?.message ?? JSON.stringify(data).slice(0, 300)}`);
  return data as T;
}

/** Books a courier for an order that is ready for dispatch. Not idempotent on Shiprocket's side, so guarded here. */
export async function bookCourier(db: Db, orderId: number, actorId: number) {
  const o = db.get("SELECT o.*, u.email FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?", [orderId]);
  if (!o) throw conflict("Order not found.");
  if (o.status !== "ready_for_dispatch") throw conflict("Mark the order ready for dispatch before booking a courier.");
  const existing = db.get("SELECT * FROM shipments WHERE order_id = ? AND kind = 'forward'", [orderId]);
  if (existing?.carrier === "shiprocket") throw conflict("A courier is already booked for this order.");
  if (existing && db.get("SELECT 1 FROM delivery_assignments WHERE shipment_id = ? AND closed_at IS NULL", [existing.id])) {
    throw conflict("This order is assigned to a CrownCart delivery partner. Reassign it first.");
  }
  const items = db.all("SELECT * FROM order_items WHERE order_id = ?", [orderId]);
  const pkg = getSetting(db, "courier");
  const [first, ...rest] = String(o.ship_name).split(" ");
  const placed = new Date(o.placed_at ?? o.created_at);
  const created = await call<{ order_id: number; shipment_id: number }>("POST", "/orders/create/adhoc", {
    order_id: o.number,
    order_date: `${placed.toISOString().slice(0, 10)} ${placed.toISOString().slice(11, 16)}`,
    pickup_location: pkg.pickupLocation,
    billing_customer_name: first,
    billing_last_name: rest.join(" "),
    billing_address: o.ship_line1,
    billing_address_2: o.ship_line2,
    billing_city: o.ship_city,
    billing_pincode: o.ship_pincode,
    billing_state: o.ship_state,
    billing_country: "India",
    billing_email: o.email,
    billing_phone: String(o.ship_phone).replace(/\D/g, "").slice(-10),
    shipping_is_billing: true,
    order_items: items.map((i) => ({ name: `${i.product_name}${i.variant_name !== "Standard" ? ` (${i.variant_name})` : ""}`, sku: i.sku, units: i.quantity, selling_price: i.unit_price_paise / 100 })),
    // Cash to collect is only the money part; points and gift cards were settled at checkout.
    payment_method: o.payment_method === "cod" && o.total_paise > 0 ? "COD" : "Prepaid",
    shipping_charges: o.shipping_paise / 100,
    total_discount: (o.discount_paise + o.points_paise + o.gift_card_paise) / 100,
    sub_total: o.subtotal_paise / 100,
    length: pkg.lengthCm,
    breadth: pkg.breadthCm,
    height: pkg.heightCm,
    weight: pkg.defaultWeightKg,
  });
  const awb = await call<{ awb_assign_status: number; response?: { data?: { awb_code?: string; courier_name?: string } }; message?: string }>("POST", "/courier/assign/awb", {
    shipment_id: created.shipment_id,
  });
  const awbCode = awb.response?.data?.awb_code;
  if (!awbCode) throw conflict(`The courier couldn't be assigned: ${awb.message ?? "no serviceable courier for this PIN code"}. The Shiprocket order was created; finish it in Shiprocket or try again.`);
  await call("POST", "/courier/generate/pickup", { shipment_id: [created.shipment_id] }).catch((e) => console.warn("[courier] pickup scheduling failed", e));
  const label = await call<{ label_url?: string }>("POST", "/courier/generate/label", { shipment_id: [created.shipment_id] }).catch(() => ({ label_url: undefined }));

  db.tx(() => {
    const fields = [awbCode, awb.response?.data?.courier_name ?? null, String(created.order_id), String(created.shipment_id), label.label_url ?? null];
    if (existing) {
      db.run(
        "UPDATE shipments SET carrier = 'shiprocket', tracking_number = ?, courier_name = ?, provider_order_id = ?, provider_shipment_id = ?, label_url = ?, status = 'pickup_scheduled', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
        [...fields, existing.id],
      );
    } else {
      db.run(
        "INSERT INTO shipments (order_id, kind, carrier, tracking_number, courier_name, provider_order_id, provider_shipment_id, label_url, status) VALUES (?, 'forward', 'shiprocket', ?, ?, ?, ?, ?, 'pickup_scheduled')",
        [orderId, ...fields],
      );
    }
    db.run("INSERT INTO order_status_history (order_id, from_status, to_status, actor_user_id, note) VALUES (?, ?, ?, ?, ?)", [
      orderId,
      o.status,
      o.status,
      actorId,
      `Courier booked: ${awb.response?.data?.courier_name ?? "Shiprocket"} · AWB ${awbCode}`,
    ]);
    audit(db, { actorId, action: "courier.booked", entityType: "order", entityId: orderId, storeId: o.store_id, details: { awb: awbCode, courier: awb.response?.data?.courier_name } });
  });
  return awbCode;
}

// Shiprocket status text → our order status.
function mapStatus(text: string): OrderStatus | "attempted" | null {
  const s = text.toUpperCase().replace(/_/g, " ");
  if (s.includes("RTO") && s.includes("DELIVERED")) return "returned_to_sender";
  if (s === "DELIVERED") return "delivered";
  if (s.includes("OUT FOR DELIVERY")) return "out_for_delivery";
  if (s.includes("UNDELIVERED") || s.includes("DELIVERY FAILED") || s.includes("NDR")) return "attempted";
  if (s.includes("PICKED UP") || s.includes("TRANSIT") || s === "SHIPPED" || s.includes("REACHED")) return "shipped";
  return null;
}

const PATH: OrderStatus[] = ["ready_for_dispatch", "shipped", "out_for_delivery", "delivered"];

/** Moves an order forward along the delivery path, one valid transition at a time. */
function advance(db: Db, order: Row, target: OrderStatus | "attempted", note: string) {
  if (target === "attempted") {
    if (order.status === "out_for_delivery") transitionOrder(db, order.id, "shipped", null, `Delivery attempted: ${note}`);
    return;
  }
  if (target === "returned_to_sender") {
    if (order.status === "ready_for_dispatch") transitionOrder(db, order.id, "shipped", null, "", { notifyCustomer: false });
    const fresh = db.get("SELECT status FROM orders WHERE id = ?", [order.id])!;
    if (["shipped", "out_for_delivery"].includes(fresh.status)) {
      transitionOrder(db, order.id, "returned_to_sender", null, "Parcel returned to the store by the courier.");
      restockOrder(db, order.id, null, "returned_to_sender");
    }
    return;
  }
  let i = PATH.indexOf(order.status);
  const goal = PATH.indexOf(target);
  if (i < 0 || goal <= i) return;
  while (i < goal) {
    i++;
    transitionOrder(db, order.id, PATH[i], null, i === goal ? note : "", { notifyCustomer: i === goal });
  }
  if (target === "delivered" && order.payment_method === "cod") db.run("UPDATE orders SET payment_status = 'cod_collected' WHERE id = ? AND payment_status = 'cod_pending'", [order.id]);
}

/** Applies courier scan events to a shipment and its order. Idempotent per (status, time). */
export function applyCourierEvents(db: Db, shipmentId: number, current: string, scans: { date: string; status: string; activity: string; location: string }[]) {
  db.tx(() => {
    const sh = db.get("SELECT * FROM shipments WHERE id = ?", [shipmentId]);
    if (!sh) return;
    for (const s of scans) {
      const at = Number.isNaN(Date.parse(s.date)) ? new Date().toISOString() : new Date(s.date).toISOString();
      db.run("INSERT OR IGNORE INTO shipment_events (shipment_id, status, description, location, occurred_at) VALUES (?, ?, ?, ?, ?)", [shipmentId, s.status, s.activity ?? "", s.location ?? "", at]);
    }
    db.run("UPDATE shipments SET status = ?, last_synced_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [
      current.toLowerCase().replace(/\s+/g, "_"),
      shipmentId,
    ]);
    const target = mapStatus(current);
    const order = db.get("SELECT * FROM orders WHERE id = ?", [sh.order_id]);
    if (target && order) advance(db, order, target, current);
  });
}

export async function syncTracking(db: Db, shipmentId: number) {
  const sh = db.get("SELECT * FROM shipments WHERE id = ? AND carrier = 'shiprocket'", [shipmentId]);
  if (!sh) throw conflict("This shipment isn't with a courier.");
  const data = await call<{ tracking_data?: { shipment_track?: { current_status?: string }[]; shipment_track_activities?: { date: string; status: string; activity: string; location: string; "sr-status-label"?: string }[] } }>(
    "GET",
    `/courier/track/awb/${encodeURIComponent(sh.tracking_number)}`,
  );
  const current = data.tracking_data?.shipment_track?.[0]?.current_status ?? "";
  const scans = (data.tracking_data?.shipment_track_activities ?? []).map((a) => ({ date: a.date, status: a["sr-status-label"] ?? a.status, activity: a.activity, location: a.location }));
  if (current) applyCourierEvents(db, shipmentId, current, scans);
  return current;
}

