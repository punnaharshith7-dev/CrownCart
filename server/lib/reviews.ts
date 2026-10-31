import type { Db } from "../db.ts";

export const MAX_REVIEW_PHOTOS = 5;

/** Order statuses that mean the customer has the product in hand. */
export const REVIEWABLE_ORDER_STATUSES = ["delivered", "return_requested", "returned"];

/** Only customers who received a product can rate it. */
export function hasReceivedProduct(db: Db, userId: number, productId: number) {
  return Boolean(
    db.get(
      `SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN (${REVIEWABLE_ORDER_STATUSES.map(() => "?").join(", ")})`,
      [userId, productId, ...REVIEWABLE_ORDER_STATUSES],
    ),
  );
}

export function reviewPhotos(db: Db, reviewId: number): string[] {
  return db.all<{ url: string }>("SELECT url FROM review_photos WHERE review_id = ? ORDER BY sort_order, id", [reviewId]).map((p) => p.url);
}
