-- Loyalty points, gift cards, referrals, SMS/WhatsApp outbox and courier tracking.

-- ── Referrals ──
ALTER TABLE users ADD COLUMN referral_code TEXT;
ALTER TABLE users ADD COLUMN referred_by INTEGER REFERENCES users(id);
CREATE UNIQUE INDEX users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;

CREATE TABLE referrals (
  id          INTEGER PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES users(id),
  referee_id  INTEGER NOT NULL UNIQUE REFERENCES users(id),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded', 'void')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  rewarded_at TEXT,
  CHECK (referrer_id != referee_id)
);

-- ── Loyalty points: an append-only ledger; the balance is the sum. ──
CREATE TABLE loyalty_ledger (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta      INTEGER NOT NULL CHECK (delta != 0),
  reason     TEXT NOT NULL,
  ref_type   TEXT,
  ref_id     TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX loyalty_ledger_user ON loyalty_ledger(user_id);
-- An order can earn points once.
CREATE UNIQUE INDEX loyalty_earn_once ON loyalty_ledger(ref_type, ref_id, reason) WHERE reason IN ('order_earned', 'referral_referrer', 'referral_referee');

-- ── Gift cards ──
CREATE TABLE gift_cards (
  id              INTEGER PRIMARY KEY,
  code            TEXT NOT NULL COLLATE NOCASE UNIQUE,
  initial_paise   INTEGER NOT NULL CHECK (initial_paise > 0),
  balance_paise   INTEGER NOT NULL CHECK (balance_paise >= 0),
  issued_by       INTEGER REFERENCES users(id),
  recipient_email TEXT,
  note            TEXT NOT NULL DEFAULT '',
  expires_at      TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (balance_paise <= initial_paise)
);

CREATE TABLE gift_card_transactions (
  id           INTEGER PRIMARY KEY,
  gift_card_id INTEGER NOT NULL REFERENCES gift_cards(id),
  delta_paise  INTEGER NOT NULL,
  reason       TEXT NOT NULL,
  checkout_id  INTEGER REFERENCES checkouts(id),
  order_id     INTEGER REFERENCES orders(id),
  actor_user_id INTEGER REFERENCES users(id),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Orders keep money (total_paise) separate from store credit used to pay.
ALTER TABLE orders ADD COLUMN points_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN points_paise INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN gift_card_paise INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN gift_card_id INTEGER REFERENCES gift_cards(id);
ALTER TABLE orders ADD COLUMN credits_restored INTEGER NOT NULL DEFAULT 0;

-- ── SMS / WhatsApp ──
CREATE TABLE message_outbox (
  id          INTEGER PRIMARY KEY,
  channel     TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
  to_phone    TEXT NOT NULL,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'logged')),
  provider_id TEXT,
  error       TEXT,
  user_id     INTEGER REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ── Courier shipments ──
ALTER TABLE shipments ADD COLUMN courier_name TEXT;
ALTER TABLE shipments ADD COLUMN provider_order_id TEXT;
ALTER TABLE shipments ADD COLUMN provider_shipment_id TEXT;
ALTER TABLE shipments ADD COLUMN label_url TEXT;
ALTER TABLE shipments ADD COLUMN last_synced_at TEXT;

CREATE TABLE shipment_events (
  id          INTEGER PRIMARY KEY,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location    TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  UNIQUE (shipment_id, status, occurred_at)
);
