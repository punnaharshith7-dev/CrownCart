import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context.ts";
import { badRequest, notFound } from "../lib/errors.ts";
import { body, email } from "../lib/validate.ts";
import { requireUser } from "../lib/auth.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { emailAdmins, notifyMany } from "../lib/notify.ts";
import { config } from "../config.ts";
import { isAutoReplying, startItemChatAutoReply } from "./assistant.ts";
import { saveUpload } from "../lib/uploads.ts";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CATEGORIES = ["order", "payment", "delivery", "returns", "product", "account", "general"] as const;

export const supportRoutes = new Hono<AppEnv>()
  /** Public contact form. Signed-in users get the ticket linked to their account. */
  .post("/tickets", async (c) => {
    rateLimit(`contact:${c.get("ip")}`, 5, 3_600_000);
    const u = c.get("user");
    const input = await body(
      c,
      z.object({
        name: z.string().trim().min(2).max(80),
        email,
        subject: z.string().trim().min(3).max(140),
        category: z.enum(CATEGORIES).default("general"),
        message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(4000),
        orderNumber: z.string().trim().max(30).optional().nullable(),
        // Honeypot: real visitors never fill this hidden field.
        website: z.string().max(200).optional(),
      }),
    );
    if (input.website) return c.json({ ok: true }, 201);
    const db = c.get("db");
    let orderId: number | null = null;
    if (input.orderNumber) {
      if (!u) throw badRequest("Sign in to link a support request to an order.");
      const o = db.get("SELECT id FROM orders WHERE number = ? AND user_id = ?", [input.orderNumber, u.id]);
      if (!o) throw badRequest("We couldn't find that order on your account.");
      orderId = o.id;
    }
    const id = db.tx(() => {
      const tid = db.run(
        "INSERT INTO support_tickets (user_id, email, name, order_id, subject, category, priority) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [u?.id ?? null, u?.email ?? input.email, input.name, orderId, input.subject, input.category, input.category === "payment" ? "high" : "normal"],
      ).lastId;
      db.run("INSERT INTO ticket_messages (ticket_id, author_user_id, body) VALUES (?, ?, ?)", [tid, u?.id ?? null, input.message]);
      const agents = db.all("SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'platform_admin'").map((r) => r.user_id);
      notifyMany(db, agents, { type: "support.new", title: `New support request: ${input.subject}`, link: `/admin/support/${tid}` });

      // Every support request and contact message is also emailed to the admin inbox, and only there.
      const items = orderId
        ? db.all("SELECT product_name, variant_name, quantity FROM order_items WHERE order_id = ?", [orderId]).map((i) => `  - ${i.quantity} × ${i.product_name} (${i.variant_name})`)
        : [];
      const fromEmail = u?.email ?? input.email;
      emailAdmins(
        db,
        `[CrownCart support #${tid}] ${input.subject}`,
        [
          `New ${orderId ? "support request" : "contact message"} #${tid}`,
          "",
          `From: ${input.name} <${fromEmail}>${u ? " (signed-in customer)" : " (guest)"}`,
          `Topic: ${input.category}`,
          ...(input.orderNumber ? [`Order: ${input.orderNumber}`, ...items] : []),
          "",
          input.message,
          "",
          "—",
          `Reply to this email to answer ${input.name} directly, or open the ticket: ${config.publicUrl}/admin/support/${tid}`,
        ].join("\n"),
        fromEmail,
      );
      return tid;
    });
    return c.json({ ok: true, ticketId: id }, 201);
  })

  /**
   * Direct chat about one product the customer ordered or received. Reopens the existing
   * conversation for that item if there is one, otherwise starts a new one. The admin is
   * emailed when the customer sends a message (see /reply).
   */
  .post("/chat", async (c) => {
    const u = requireUser(c);
    rateLimit(`support-chat:${u.id}`, 30, 3_600_000);
    const input = await body(c, z.object({ orderNumber: z.string().trim().min(1).max(30), orderItemId: z.number().int().positive() }));
    const db = c.get("db");
    const item = db.get(
      `SELECT o.id AS order_id, o.number, o.status, i.product_name, i.variant_name
         FROM orders o JOIN order_items i ON i.order_id = o.id
        WHERE o.number = ? AND o.user_id = ? AND i.id = ?`,
      [input.orderNumber, u.id, input.orderItemId],
    );
    if (!item) throw notFound("We couldn't find that item on your orders.");
    if (["pending_payment", "failed", "expired"].includes(item.status)) throw badRequest("Chat opens once the order is placed.");

    const subject = `Chat: ${item.product_name}${item.variant_name && item.variant_name !== "Standard" ? ` (${item.variant_name})` : ""} · order ${item.number}`.slice(0, 140);
    const existing = db.get("SELECT id FROM support_tickets WHERE user_id = ? AND order_item_id = ? AND status != 'closed' ORDER BY id DESC LIMIT 1", [u.id, input.orderItemId]);
    if (existing) return c.json({ ticketId: existing.id, created: false });
    const id = db.run(
      "INSERT INTO support_tickets (user_id, email, name, order_id, order_item_id, subject, category, priority) VALUES (?, ?, ?, ?, ?, ?, 'order', 'normal')",
      [u.id, u.email, u.name, item.order_id, input.orderItemId, subject],
    ).lastId;
    return c.json({ ticketId: id, created: true }, 201);
  })

  .get("/tickets", (c) => {
    const u = requireUser(c);
    return c.json({
      tickets: c.get("db").all(
        "SELECT t.id, t.subject, t.category, t.status, t.created_at, t.updated_at, o.number AS order_number FROM support_tickets t LEFT JOIN orders o ON o.id = t.order_id WHERE t.user_id = ? ORDER BY t.updated_at DESC",
        [u.id],
      ),
    });
  })

  .get("/tickets/:id", (c) => {
    const u = requireUser(c);
    const db = c.get("db");
    const t = db.get("SELECT * FROM support_tickets WHERE id = ? AND user_id = ?", [Number(c.req.param("id")), u.id]);
    if (!t) throw notFound();
    const messages = db.all(
      `SELECT m.body, m.is_staff, m.is_ai, m.created_at, CASE WHEN m.photo IS NULL THEN NULL ELSE '/api/support/photos/' || m.photo END AS photo,
              CASE WHEN m.is_ai = 1 THEN 'CrownCart AI' WHEN m.is_staff = 1 THEN 'CrownCart Support' ELSE u.name END AS author
         FROM ticket_messages m LEFT JOIN users u ON u.id = m.author_user_id WHERE m.ticket_id = ? ORDER BY m.id`,
      [t.id],
    );
    return c.json({
      // itemChat: a "Chat about this item" conversation, where photos can be attached.
      ticket: { id: t.id, subject: t.subject, status: t.status, category: t.category, createdAt: t.created_at, itemChat: Boolean(t.order_item_id) },
      messages,
      // The AI is drafting a reply right now (item chats only); the page shows a typing indicator.
      aiReplying: isAutoReplying(t.id),
    });
  })

  .post("/tickets/:id/reply", async (c) => {
    const u = requireUser(c);
    // Chats send several short messages, so the limit is generous.
    rateLimit(`ticket-reply:${u.id}`, 60, 3_600_000);
    const { message } = await body(c, z.object({ message: z.string().trim().min(1).max(4000) }));
    const db = c.get("db");
    const t = db.get("SELECT * FROM support_tickets WHERE id = ? AND user_id = ?", [Number(c.req.param("id")), u.id]);
    if (!t) throw notFound();
    db.tx(() => {
      const first = !db.get("SELECT 1 FROM ticket_messages WHERE ticket_id = ?", [t.id]);
      db.run("INSERT INTO ticket_messages (ticket_id, author_user_id, body) VALUES (?, ?, ?)", [t.id, u.id, message]);
      db.run("UPDATE support_tickets SET status = 'open', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [t.id]);
      if (first) {
        const agents = db.all("SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'platform_admin'").map((r) => r.user_id);
        notifyMany(db, agents, { type: "support.new", title: `New chat: ${t.subject}`, link: `/admin/support/${t.id}` });
      }
      emailAdmins(
        db,
        `[CrownCart support #${t.id}] ${first ? "" : "Re: "}${t.subject}`,
        `${u.name} <${u.email}> ${first ? "started a chat" : "replied"} on support ticket #${t.id}:\n\n${message}\n\n—\nReply to this email to answer directly, or open the chat: ${config.publicUrl}/admin/support/${t.id}`,
        u.email,
      );
    });
    // Item chats get an AI auto-reply until a person from the team joins; it runs after the response.
    const aiReplying = Boolean(t.order_item_id) && startItemChatAutoReply(db, t.id);
    return c.json({ ok: true, aiReplying });
  })

  /** Attach a photo (JPG, PNG or WebP only) to an item chat, with an optional caption. */
  .post("/tickets/:id/photo", async (c) => {
    const u = requireUser(c);
    rateLimit(`ticket-photo:${u.id}`, 20, 3_600_000);
    const db = c.get("db");
    const t = db.get("SELECT * FROM support_tickets WHERE id = ? AND user_id = ?", [Number(c.req.param("id")), u.id]);
    if (!t) throw notFound();
    if (!t.order_item_id) throw badRequest("Photos can only be added in an item chat from your order page.");
    const form = await c.req.formData().catch(() => null);
    const file = form?.get("photo");
    if (!(file instanceof File)) throw badRequest("Choose a photo to send.");
    if (file.size > 8 << 20) throw badRequest("Photo is too large (max 8 MB).");
    const caption = String(form!.get("caption") ?? "").trim().slice(0, 1000);
    // Only images pass: the file's own bytes are checked, never its name or claimed type.
    const saved = await saveUpload(file, photoDir(), ["image"]);
    db.tx(() => {
      db.run("INSERT INTO ticket_messages (ticket_id, author_user_id, body, photo) VALUES (?, ?, ?, ?)", [t.id, u.id, caption ? `📷 ${caption}` : "📷 Photo", saved.name]);
      db.run("UPDATE support_tickets SET status = 'open', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [t.id]);
      emailAdmins(
        db,
        `[CrownCart support #${t.id}] Photo: ${t.subject}`,
        `${u.name} <${u.email}> sent a photo on support ticket #${t.id}${caption ? `:\n\n${caption}` : "."}\n\nView it in the chat (admin sign-in required): ${config.publicUrl}/admin/support/${t.id}`,
        u.email,
      );
    });
    const aiReplying = startItemChatAutoReply(db, t.id);
    return c.json({ ok: true, aiReplying }, 201);
  })

  /** Serves a chat photo to the customer who sent it, or to support admins. Never public. */
  .get("/photos/:name", (c) => {
    const u = requireUser(c);
    const name = c.req.param("name");
    if (!/^[a-z0-9]+-[A-Za-z0-9_-]+\.(jpg|png|webp)$/.test(name)) throw notFound();
    const db = c.get("db");
    const row = db.get("SELECT t.user_id FROM ticket_messages m JOIN support_tickets t ON t.id = m.ticket_id WHERE m.photo = ?", [name]);
    if (!row || (row.user_id !== u.id && !u.permissions.has("admin.support"))) throw notFound();
    const path = join(photoDir(), name);
    if (!existsSync(path)) throw notFound();
    const type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return c.body(readFileSync(path), 200, { "Content-Type": type, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" });
  });

const photoDir = () => join(config.privateStorageDir, "support-photos");
