-- CrownCart initial schema.
-- Money is stored as integer paise. Timestamps are ISO-8601 UTC strings.

-- ───────────────────────── Identity & permissions ─────────────────────────

CREATE TABLE users (
  id                  INTEGER PRIMARY KEY,
  email               TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash       TEXT,
  name                TEXT NOT NULL,
  phone               TEXT,
  email_verified_at   TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'suspended', 'deleted')),
  preferences         TEXT NOT NULL DEFAULT '{}',
  failed_login_count  INTEGER NOT NULL DEFAULT 0,
  locked_until        TEXT,
  deletion_requested_at TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE roles (
  id          INTEGER PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE permissions (
  id          INTEGER PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE role_permissions (
  role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id    INTEGER NOT NULL REFERENCES roles(id),
  granted_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE sessions (
  id           TEXT PRIMARY KEY,               -- sha256 of the cookie token
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at   TEXT NOT NULL,
  ip           TEXT,
  user_agent   TEXT,
  revoked_at   TEXT
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE verification_tokens (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL CHECK (purpose IN ('email_verify', 'password_reset')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE stores (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL DEFAULT '',
  contact_email TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'active', 'suspended')),
  pickup_address TEXT NOT NULL DEFAULT '',
  pickup_pincode TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE store_members (
  store_id    INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL
              CHECK (member_role IN ('owner', 'product_editor', 'inventory_operator', 'order_manager', 'analyst')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (store_id, user_id)
);
CREATE INDEX store_members_user ON store_members(user_id);

CREATE TABLE invitations (
  id          INTEGER PRIMARY KEY,
  email       TEXT NOT NULL COLLATE NOCASE,
  role_key    TEXT NOT NULL,
  store_id    INTEGER REFERENCES stores(id),
  member_role TEXT,
  token_hash  TEXT NOT NULL UNIQUE,
  invited_by  INTEGER NOT NULL REFERENCES users(id),
  expires_at  TEXT NOT NULL,
  accepted_at TEXT,
  revoked_at  TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE delivery_partners (
  user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'suspended')),
  availability     TEXT NOT NULL DEFAULT 'offline'
                   CHECK (availability IN ('available', 'busy', 'offline')),
  service_pincodes TEXT NOT NULL DEFAULT '',
  vehicle          TEXT NOT NULL DEFAULT '',
  approved_by      INTEGER REFERENCES users(id),
  approved_at      TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE audit_logs (
  id            INTEGER PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id),
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT,
  store_id      INTEGER REFERENCES stores(id),
  details       TEXT NOT NULL DEFAULT '{}',
  ip            TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX audit_logs_created ON audit_logs(created_at);
CREATE INDEX audit_logs_actor ON audit_logs(actor_user_id);

-- ───────────────────────────────── Catalog ─────────────────────────────────

CREATE TABLE categories (
  id          INTEGER PRIMARY KEY,
  parent_id   INTEGER REFERENCES categories(id),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE brands (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
  id              INTEGER PRIMARY KEY,
  store_id        INTEGER NOT NULL REFERENCES stores(id),
  brand_id        INTEGER REFERENCES brands(id),
  category_id     INTEGER REFERENCES categories(id),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  title_line1     TEXT NOT NULL DEFAULT '',
  title_line2     TEXT NOT NULL DEFAULT '',
  accent          TEXT NOT NULL DEFAULT '',
  tagline         TEXT NOT NULL DEFAULT '',
  badge           TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  care            TEXT NOT NULL DEFAULT '',
  warranty        TEXT NOT NULL DEFAULT '',
  return_days     INTEGER NOT NULL DEFAULT 7 CHECK (return_days >= 0),
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'archived')),
  is_featured     INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  showcase_order  INTEGER,
  seo_title       TEXT,
  seo_description TEXT,
  view_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX products_store ON products(store_id);
CREATE INDEX products_category ON products(category_id);
CREATE INDEX products_status ON products(status);

CREATE TABLE product_specs (
  id         INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  value      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX product_specs_product ON product_specs(product_id);

CREATE TABLE product_variants (
  id                INTEGER PRIMARY KEY,
  product_id        INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku               TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL DEFAULT 'Standard',
  color             TEXT,
  size              TEXT,
  price_paise       INTEGER NOT NULL CHECK (price_paise > 0),
  compare_at_paise  INTEGER CHECK (compare_at_paise IS NULL OR compare_at_paise > 0),
  max_per_order     INTEGER NOT NULL DEFAULT 5 CHECK (max_per_order > 0),
  is_active         INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX product_variants_product ON product_variants(product_id);

CREATE TABLE inventory (
  variant_id          INTEGER PRIMARY KEY REFERENCES product_variants(id) ON DELETE CASCADE,
  on_hand             INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved            INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  CHECK (reserved <= on_hand)
);

CREATE TABLE inventory_movements (
  id             INTEGER PRIMARY KEY,
  variant_id     INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  delta_on_hand  INTEGER NOT NULL DEFAULT 0,
  delta_reserved INTEGER NOT NULL DEFAULT 0,
  reason         TEXT NOT NULL,
  ref_type       TEXT,
  ref_id         TEXT,
  actor_user_id  INTEGER REFERENCES users(id),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX inventory_movements_variant ON inventory_movements(variant_id);

CREATE TABLE product_media (
  id         INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('image', 'hero', 'video', 'model', 'poster')),
  url        TEXT NOT NULL,
  alt        TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX product_media_product ON product_media(product_id);

CREATE TABLE collections (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_active   INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE collection_products (
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

-- ──────────────────────────────── Shopping ────────────────────────────────

CREATE TABLE cart_items (
  id              INTEGER PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant_id      INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  saved_for_later INTEGER NOT NULL DEFAULT 0 CHECK (saved_for_later IN (0, 1)),
  added_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (user_id, variant_id)
);

-- Makes add-to-cart idempotent: a retried request with the same id is a no-op.
CREATE TABLE cart_requests (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, request_id)
);

CREATE TABLE wishlist_items (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE recently_viewed (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE stock_alerts (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  notified_at TEXT,
  PRIMARY KEY (user_id, variant_id)
);

CREATE TABLE addresses (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL DEFAULT 'Home',
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  line1      TEXT NOT NULL,
  line2      TEXT NOT NULL DEFAULT '',
  city       TEXT NOT NULL,
  state      TEXT NOT NULL,
  pincode    TEXT NOT NULL CHECK (length(pincode) = 6),
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX addresses_user ON addresses(user_id);

CREATE TABLE coupons (
  id                 INTEGER PRIMARY KEY,
  code               TEXT NOT NULL COLLATE NOCASE UNIQUE,
  store_id           INTEGER REFERENCES stores(id),   -- NULL = platform-wide
  kind               TEXT NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value              INTEGER NOT NULL CHECK (value > 0),  -- percent (1-100) or paise
  min_order_paise    INTEGER NOT NULL DEFAULT 0,
  max_discount_paise INTEGER,
  starts_at          TEXT,
  ends_at            TEXT,
  usage_limit        INTEGER,
  per_user_limit     INTEGER NOT NULL DEFAULT 1,
  first_order_only   INTEGER NOT NULL DEFAULT 0,
  is_active          INTEGER NOT NULL DEFAULT 1,
  description        TEXT NOT NULL DEFAULT '',
  created_by         INTEGER REFERENCES users(id),
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (kind = 'fixed' OR value <= 100)
);

-- ─────────────────────────── Orders & payments ───────────────────────────

-- One checkout can span several stores; it is split into one order per store
-- and paid with a single payment.
CREATE TABLE checkouts (
  id              INTEGER PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  idempotency_key TEXT NOT NULL,
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('cod', 'razorpay')),
  total_paise     INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cod')),
  expires_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE orders (
  id               INTEGER PRIMARY KEY,
  number           TEXT NOT NULL UNIQUE,
  checkout_id      INTEGER NOT NULL REFERENCES checkouts(id),
  user_id          INTEGER NOT NULL REFERENCES users(id),
  store_id         INTEGER NOT NULL REFERENCES stores(id),
  status           TEXT NOT NULL,
  payment_method   TEXT NOT NULL CHECK (payment_method IN ('cod', 'razorpay')),
  payment_status   TEXT NOT NULL
                   CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod_pending', 'cod_collected', 'refund_pending', 'partially_refunded', 'refunded')),
  subtotal_paise   INTEGER NOT NULL,
  discount_paise   INTEGER NOT NULL DEFAULT 0,
  shipping_paise   INTEGER NOT NULL DEFAULT 0,
  tax_paise        INTEGER NOT NULL DEFAULT 0,
  total_paise      INTEGER NOT NULL,
  refunded_paise   INTEGER NOT NULL DEFAULT 0,
  coupon_code      TEXT,
  ship_name        TEXT NOT NULL,
  ship_phone       TEXT NOT NULL,
  ship_line1       TEXT NOT NULL,
  ship_line2       TEXT NOT NULL DEFAULT '',
  ship_city        TEXT NOT NULL,
  ship_state       TEXT NOT NULL,
  ship_pincode     TEXT NOT NULL,
  placed_at        TEXT,
  delivered_at     TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX orders_user ON orders(user_id);
CREATE INDEX orders_store ON orders(store_id);
CREATE INDEX orders_status ON orders(status);
CREATE INDEX orders_checkout ON orders(checkout_id);

CREATE TABLE order_items (
  id               INTEGER PRIMARY KEY,
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       INTEGER NOT NULL REFERENCES products(id),
  variant_id       INTEGER NOT NULL REFERENCES product_variants(id),
  product_name     TEXT NOT NULL,
  variant_name     TEXT NOT NULL,
  sku              TEXT NOT NULL,
  image            TEXT,
  unit_price_paise INTEGER NOT NULL,
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  line_total_paise INTEGER NOT NULL,
  returned_qty     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX order_items_order ON order_items(order_id);

CREATE TABLE order_status_history (
  id            INTEGER PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status   TEXT,
  to_status     TEXT NOT NULL,
  actor_user_id INTEGER REFERENCES users(id),
  note          TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX order_status_history_order ON order_status_history(order_id);

CREATE TABLE coupon_redemptions (
  id         INTEGER PRIMARY KEY,
  coupon_id  INTEGER NOT NULL REFERENCES coupons(id),
  user_id    INTEGER NOT NULL REFERENCES users(id),
  checkout_id INTEGER NOT NULL REFERENCES checkouts(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE payments (
  id                  INTEGER PRIMARY KEY,
  checkout_id         INTEGER NOT NULL REFERENCES checkouts(id),
  provider            TEXT NOT NULL,
  provider_order_id   TEXT UNIQUE,
  provider_payment_id TEXT UNIQUE,
  amount_paise        INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'created'
                      CHECK (status IN ('created', 'captured', 'failed', 'refunded', 'partially_refunded')),
  failure_reason      TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Every inbound provider event is recorded once; the UNIQUE event_id makes
-- duplicate webhook deliveries a no-op.
CREATE TABLE payment_events (
  id           INTEGER PRIMARY KEY,
  provider     TEXT NOT NULL,
  event_id     TEXT NOT NULL,
  type         TEXT NOT NULL,
  payload      TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (provider, event_id)
);

CREATE TABLE refunds (
  id                 INTEGER PRIMARY KEY,
  order_id           INTEGER NOT NULL REFERENCES orders(id),
  payment_id         INTEGER REFERENCES payments(id),
  return_id          INTEGER,
  amount_paise       INTEGER NOT NULL CHECK (amount_paise > 0),
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'processed', 'failed', 'manual')),
  provider_refund_id TEXT UNIQUE,
  reason             TEXT NOT NULL DEFAULT '',
  created_by         INTEGER REFERENCES users(id),
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ───────────────────────── Shipping & delivery ─────────────────────────

CREATE TABLE shipments (
  id              INTEGER PRIMARY KEY,
  order_id        INTEGER NOT NULL REFERENCES orders(id),
  kind            TEXT NOT NULL DEFAULT 'forward' CHECK (kind IN ('forward', 'return')),
  tracking_number TEXT NOT NULL UNIQUE,
  carrier         TEXT NOT NULL DEFAULT 'crowncart_fleet',
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX shipments_order ON shipments(order_id);

CREATE TABLE delivery_assignments (
  id              INTEGER PRIMARY KEY,
  shipment_id     INTEGER NOT NULL REFERENCES shipments(id),
  partner_user_id INTEGER NOT NULL REFERENCES users(id),
  status          TEXT NOT NULL DEFAULT 'assigned',
  otp_hash        TEXT,
  otp_attempts    INTEGER NOT NULL DEFAULT 0,
  assigned_by     INTEGER REFERENCES users(id),
  failure_reason  TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  closed_at       TEXT
);
CREATE INDEX delivery_assignments_partner ON delivery_assignments(partner_user_id);
CREATE INDEX delivery_assignments_shipment ON delivery_assignments(shipment_id);

CREATE TABLE delivery_status_history (
  id            INTEGER PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES delivery_assignments(id) ON DELETE CASCADE,
  from_status   TEXT,
  to_status     TEXT NOT NULL,
  actor_user_id INTEGER REFERENCES users(id),
  reason        TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE proof_of_delivery (
  id             INTEGER PRIMARY KEY,
  assignment_id  INTEGER NOT NULL UNIQUE REFERENCES delivery_assignments(id),
  recipient_name TEXT NOT NULL,
  otp_verified   INTEGER NOT NULL DEFAULT 0,
  photo_path     TEXT,
  notes          TEXT NOT NULL DEFAULT '',
  delivered_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ─────────────────────────── Returns & support ───────────────────────────

CREATE TABLE return_requests (
  id              INTEGER PRIMARY KEY,
  order_id        INTEGER NOT NULL REFERENCES orders(id),
  user_id         INTEGER NOT NULL REFERENCES users(id),
  kind            TEXT NOT NULL DEFAULT 'return' CHECK (kind IN ('return', 'exchange')),
  status          TEXT NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested', 'approved', 'rejected', 'picked_up', 'received', 'refunded', 'cancelled')),
  reason          TEXT NOT NULL,
  details         TEXT NOT NULL DEFAULT '',
  resolution_note TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX return_requests_order ON return_requests(order_id);

CREATE TABLE return_items (
  return_id     INTEGER NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id),
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (return_id, order_item_id)
);

CREATE TABLE reviews (
  id                INTEGER PRIMARY KEY,
  product_id        INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating            INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             TEXT NOT NULL DEFAULT '',
  body              TEXT NOT NULL DEFAULT '',
  verified_purchase INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'published', 'rejected')),
  helpful_count     INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (product_id, user_id)
);

CREATE TABLE support_tickets (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  email      TEXT NOT NULL,
  name       TEXT NOT NULL DEFAULT '',
  order_id   INTEGER REFERENCES orders(id),
  subject    TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'general',
  priority   TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  assigned_to INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE ticket_messages (
  id             INTEGER PRIMARY KEY,
  ticket_id      INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_user_id INTEGER REFERENCES users(id),
  is_staff       INTEGER NOT NULL DEFAULT 0,
  body           TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE notifications (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  link       TEXT,
  read_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX notifications_user ON notifications(user_id, read_at);

-- ─────────────────────────── Platform operations ───────────────────────────

CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Outgoing email. Without a configured provider, messages are kept here with
-- status 'logged' instead of being presented as sent.
CREATE TABLE email_outbox (
  id         INTEGER PRIMARY KEY,
  to_email   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'logged')),
  error      TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE search_queries (
  id         INTEGER PRIMARY KEY,
  query      TEXT NOT NULL,
  results    INTEGER NOT NULL,
  user_id    INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE analytics_events (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  user_id    INTEGER REFERENCES users(id),
  product_id INTEGER,
  props      TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX analytics_events_name ON analytics_events(name, created_at);
