import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context.ts";
import { badRequest, notFound } from "../lib/errors.ts";
import { body, email } from "../lib/validate.ts";
import { requireUser } from "../lib/auth.ts";
import { rateLimit } from "../lib/rate-limit.ts";
import { notifyMany } from "../lib/notify.ts";

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
      return tid;
    });
    return c.json({ ok: true, ticketId: id }, 201);
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
      "SELECT m.body, m.is_staff, m.created_at, CASE WHEN m.is_staff = 1 THEN 'CrownCart Support' ELSE u.name END AS author FROM ticket_messages m LEFT JOIN users u ON u.id = m.author_user_id WHERE m.ticket_id = ? ORDER BY m.id",
      [t.id],
    );
    return c.json({ ticket: { id: t.id, subject: t.subject, status: t.status, category: t.category, createdAt: t.created_at }, messages });
  })

  .post("/tickets/:id/reply", async (c) => {
    const u = requireUser(c);
    rateLimit(`ticket-reply:${u.id}`, 20, 3_600_000);
    const { message } = await body(c, z.object({ message: z.string().trim().min(2).max(4000) }));
    const db = c.get("db");
    const t = db.get("SELECT * FROM support_tickets WHERE id = ? AND user_id = ?", [Number(c.req.param("id")), u.id]);
    if (!t) throw notFound();
    db.tx(() => {
      db.run("INSERT INTO ticket_messages (ticket_id, author_user_id, body) VALUES (?, ?, ?)", [t.id, u.id, message]);
      db.run("UPDATE support_tickets SET status = 'open', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [t.id]);
    });
    return c.json({ ok: true });
  });
