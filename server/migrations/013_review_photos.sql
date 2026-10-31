-- Photos customers attach to their reviews.
CREATE TABLE review_photos (
  id         INTEGER PRIMARY KEY,
  review_id  INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_review_photos_review ON review_photos (review_id, sort_order);
