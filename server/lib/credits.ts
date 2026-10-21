import { randomInt } from "node:crypto";
import type { Db } from "../db.ts";
import { getSetting } from "./settings.ts";
import { notify } from "./notify.ts";
import { conflict } from "./errors.ts";

// ───────────────────────────── Loyalty points ─────────────────────────────

export function pointsBalance(db: Db, userId: number): number {
  return db.get<{ n: number }>("SELECT COALESCE(SUM(delta), 0) n FROM loyalty_ledger WHERE user_id = ?", [userId])!.n;
}

/** Ledger write. Earn entries are unique per (order, reason) so retries never double-credit. */
export function addPoints(db: Db, userId: number, delta: number, reason: string, refType: string | null = null, refId: string | number | null = null) {
  if (!delta) return false;
  const r = db.run("INSERT OR IGNORE INTO loyalty_ledger (user_id, delta, reason, ref_type, ref_id) VALUES (?, ?, ?, ?, ?)", [
    userId,
    delta,
    reason,
    refType,
    refId == null ? null : String(refId),
  ]);
  return r.changes > 0;
}

/** Points earned for an order: on what the customer spent on products, excluding points they redeemed. */
export function pointsForOrder(db: Db, o: { subtotal_paise: number; discount_paise: number; points_paise: number }) {
  const l = getSetting(db, "loyalty");
  const base = Math.max(0, o.subtotal_paise - o.discount_paise - o.points_paise);
  return Math.floor(base / 10_000) * l.pointsPerHundredRupees;
}

/** Called when an order is delivered: award points, and settle any pending referral. */
export function onOrderDelivered(db: Db, orderId: number) {
  const o = db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!o) return;
  const l = getSetting(db, "loyalty");
  if (l.enabled) {
    const pts = pointsForOrder(db, o as { subtotal_paise: number; discount_paise: number; points_paise: number });
    if (pts > 0 && addPoints(db, o.user_id, pts, "order_earned", "order", orderId)) {
      notify(db, o.user_id, { type: "loyalty.earned", title: `You earned ${pts} CrownCart points`, body: `For order ${o.number}.`, link: "/account/rewards" });
    }
  }
  const ref = getSetting(db, "referrals");
  const pending = db.get("SELECT * FROM referrals WHERE referee_id = ? AND status = 'pending'", [o.user_id]);
  if (ref.enabled && pending) {
    db.run("UPDATE referrals SET status = 'rewarded', rewarded_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?", [pending.id]);
    if (addPoints(db, pending.referrer_id, ref.referrerPoints, "referral_referrer", "referral", pending.id)) {
      notify(db, pending.referrer_id, { type: "referral.rewarded", title: `Your referral earned you ${ref.referrerPoints} points`, body: "A friend you invited received their first order.", link: "/account/rewards" });
    }
    if (addPoints(db, o.user_id, ref.refereePoints, "referral_referee", "referral", pending.id)) {
      notify(db, o.user_id, { type: "referral.rewarded", title: `Welcome bonus: ${ref.refereePoints} points`, body: "Thanks for joining through a friend.", link: "/account/rewards" });
    }
  }
}

/** Takes back points earned on the part of an order that was returned. */
export function onOrderReturned(db: Db, orderId: number) {
  const o = db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!o) return;
  const earned = db.get<{ n: number }>("SELECT COALESCE(SUM(delta), 0) n FROM loyalty_ledger WHERE ref_type = 'order' AND ref_id = ? AND reason IN ('order_earned', 'return_reversed')", [String(orderId)])!.n;
  if (earned <= 0) return;
  const returnedValue = db.get<{ n: number }>("SELECT COALESCE(SUM(unit_price_paise * returned_qty), 0) n FROM order_items WHERE order_id = ?", [orderId])!.n;
  const fraction = o.subtotal_paise ? Math.min(1, returnedValue / o.subtotal_paise) : 1;
  const original = db.get<{ n: number }>("SELECT COALESCE(SUM(delta), 0) n FROM loyalty_ledger WHERE ref_type = 'order' AND ref_id = ? AND reason = 'order_earned'", [String(orderId)])!.n;
  const shouldKeep = Math.floor(original * (1 - fraction));
  const takeBack = Math.min(earned - shouldKeep, Math.max(0, pointsBalance(db, o.user_id)));
  if (takeBack > 0) addPoints(db, o.user_id, -takeBack, "return_reversed", "order", orderId);
}

// ──────────────────────────────── Gift cards ────────────────────────────────

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid misreads

export function newGiftCardCode(db: Db) {
  for (;;) {
    const part = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    const code = `CC-${part()}-${part()}-${part()}`;
    if (!db.get("SELECT 1 FROM gift_cards WHERE code = ?", [code])) return code;
  }
}

export function findGiftCard(db: Db, code: string): { card: any } | { error: string } {
  if (!getSetting(db, "giftCards").enabled) return { error: "Gift cards can't be used right now." };
  const card = db.get("SELECT * FROM gift_cards WHERE code = ?", [code.trim().toUpperCase()]);
  if (!card || !card.is_active) return { error: "This gift card code is not valid." };
  if (card.expires_at && card.expires_at < new Date().toISOString()) return { error: "This gift card has expired." };
  if (card.balance_paise <= 0) return { error: "This gift card has no balance left." };
  return { card };
}

/** Debits a gift card. Throws if the balance changed underneath us. Call inside db.tx(). */
export function debitGiftCard(db: Db, cardId: number, amount: number, checkoutId: number, orderId: number, actorId: number) {
  const r = db.run("UPDATE gift_cards SET balance_paise = balance_paise - ? WHERE id = ? AND balance_paise >= ?", [amount, cardId, amount]);
  if (!r.changes) throw conflict("Your gift card balance changed. Please review your order again.", { reason: "total_changed" });
  db.run("INSERT INTO gift_card_transactions (gift_card_id, delta_paise, reason, checkout_id, order_id, actor_user_id) VALUES (?, ?, 'redeemed', ?, ?, ?)", [
    cardId,
    -amount,
    checkoutId,
    orderId,
    actorId,
  ]);
}

function creditGiftCard(db: Db, cardId: number, amount: number, orderId: number, reason: string) {
  if (amount <= 0) return;
  // Never above the card's original value.
  db.run("UPDATE gift_cards SET balance_paise = MIN(initial_paise, balance_paise + ?) WHERE id = ?", [amount, cardId]);
  db.run("INSERT INTO gift_card_transactions (gift_card_id, delta_paise, reason, order_id) VALUES (?, ?, ?, ?)", [cardId, amount, reason, orderId]);
}

// ───────────────────────────── Order credit reversal ─────────────────────────────

/**
 * Returns all points and gift-card value used on an order that will not be
 * fulfilled (cancelled, payment failed, expired). Idempotent.
 */
export function restoreOrderCredits(db: Db, orderId: number, reason: string) {
  const o = db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!o || o.credits_restored || (!o.points_used && !o.gift_card_paise)) return;
  db.run("UPDATE orders SET credits_restored = 1 WHERE id = ?", [orderId]);
  if (o.points_used) addPoints(db, o.user_id, o.points_used, "order_credit_restored", "order_restore", `${orderId}:${reason}`);
  if (o.gift_card_id && o.gift_card_paise) creditGiftCard(db, o.gift_card_id, o.gift_card_paise, orderId, `restored: ${reason}`);
}

/**
 * Splits a refund between money and store credit in the same proportion the
 * order was paid, returns the store-credit part to points/gift card, and
 * returns the money part for the payment provider.
 */
export function splitRefund(db: Db, orderId: number, amount: number): number {
  const o = db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!o) return amount;
  const credit = o.points_paise + o.gift_card_paise;
  const paidTotal = o.total_paise + credit;
  if (!credit || !paidTotal) return amount;
  const creditShare = Math.round((amount * credit) / paidTotal);
  const gcShare = Math.round((creditShare * o.gift_card_paise) / credit);
  const pointsShare = creditShare - gcShare;
  if (gcShare && o.gift_card_id) creditGiftCard(db, o.gift_card_id, gcShare, orderId, "refund");
  const value = getSetting(db, "loyalty").pointValuePaise;
  const pts = Math.floor(pointsShare / value);
  if (pts > 0) addPoints(db, o.user_id, pts, "refund", "order", orderId);
  return amount - creditShare;
}

// ──────────────────────────────── Referrals ────────────────────────────────

export function referralCodeFor(db: Db, userId: number): string {
  const row = db.get("SELECT referral_code, name FROM users WHERE id = ?", [userId])!;
  if (row.referral_code) return row.referral_code;
  const stem = String(row.name ?? "CROWN").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "CROWN";
  for (;;) {
    const code = `${stem}${randomInt(100, 1000)}`;
    if (!db.get("SELECT 1 FROM users WHERE referral_code = ?", [code])) {
      db.run("UPDATE users SET referral_code = ? WHERE id = ?", [code, userId]);
      return code;
    }
  }
}

/** Records who referred a brand-new account. Silently ignores invalid or self codes. */
export function attachReferral(db: Db, newUserId: number, code: string | undefined | null) {
  if (!code || !getSetting(db, "referrals").enabled) return;
  const referrer = db.get("SELECT id FROM users WHERE referral_code = ? AND status = 'active'", [code.trim().toUpperCase()]);
  if (!referrer || referrer.id === newUserId) return;
  db.run("UPDATE users SET referred_by = ? WHERE id = ?", [referrer.id, newUserId]);
  db.run("INSERT OR IGNORE INTO referrals (referrer_id, referee_id) VALUES (?, ?)", [referrer.id, newUserId]);
}
