# CrownCart — build status

**Everything below is built but not tested.** At the owner's request no automated tests,
browser walkthroughs or app runs were done. The only checks were TypeScript type checks
(frontend and server pass) and applying the schema to an in-memory database once.

## Run it locally

```bash
cp .env.example .env          # then set SEED_PASSWORD to something 10+ characters
npm install
npm run seed:dev              # demo accounts + the 4 original products
npm run dev                   # API on :8787, storefront on http://localhost:5173
```

Demo accounts (password = `SEED_PASSWORD`, development only — `seed:dev` refuses to run in production):

| Role | Email | Lands on |
| --- | --- | --- |
| Customer | customer@crowncart.local | `/account` |
| Store owner | owner@crowncart.local | `/owner` |
| Delivery partner | rider@crowncart.local | `/delivery` |
| Platform admin | admin@crowncart.local | `/admin` |

Coupon `WELCOME10` gives 10% off a first order (max ₹1,000).
With no email provider set, emails are printed in the API console and listed at `/admin/emails`.

## Architecture

- **Frontend:** Vite + React 19 + React Three Fiber (unchanged homepage scene), React Router.
  `src/pages/*` (lazy-loaded), `src/components/*`, design tokens in `src/styles/app.css`
  (light, dark and system themes).
- **API:** Hono on Node 22.13+ (`server/`), TypeScript run directly by Node (no build step).
- **Database:** SQLite through Node's built-in `node:sqlite` (`server/data/crowncart.db`), migrations in
  `server/migrations/`. Chosen for local development because Postgres isn't installed and the
  machine is memory-constrained; the SQL is kept portable for a later move to PostgreSQL.
- **Auth:** scrypt password hashes, opaque session tokens in HttpOnly SameSite=Lax cookies (hashed in
  the DB), Origin-checked CSRF defence, rate limits, and lockout after 8 failed sign-ins.
- **Roles:** `customer`, `store_owner`, `delivery_partner`, `platform_admin` in `user_roles`; store staff
  roles in `store_members`. Every protected route checks on the server (`server/lib/auth.ts`).
  Public sign-up only ever creates customers; other roles come from admin invitations or grants.

## Feature checklist

| Area | Status |
| --- | --- |
| Original immersive homepage (baubles scene, typography, numbering, menu) | Kept; wired to real data |
| Homepage "Acquire Now" → real add-to-bag (or size picker), live prices and ratings | Built |
| Invented reviews, ratings and counts removed; gallery shows real reviews only | Built |
| Why CrownCart, Our Story, real category counts | Built |
| Add to Bag while signed out → Sign In → item added automatically (idempotent) | Built |
| Sign in, register, forgot/reset password, email verification, invitations | Built |
| Shop: search, autocomplete, typo suggestion, synonyms, filters, sort, pagination (state in URL) | Built |
| Product page: gallery, zoom, variants, stock, delivery check, reviews, related, JSON-LD | Built |
| Persistent bag, save for later, wishlist moves, coupons, server-calculated totals | Built |
| Checkout: addresses, serviceability, COD, idempotent order placement, stock reservation | Built |
| Razorpay online payments: order creation, signature + amount verification, webhooks, refunds | Built — needs keys (docs/INTEGRATIONS.md) |
| Google sign-in (OAuth code flow + PKCE, account linking by verified email) | Built — needs keys (docs/INTEGRATIONS.md) |
| Transactional email via Resend | Built — needs keys (docs/INTEGRATIONS.md) |
| Customer account: orders, tracking timeline, cancel, return/exchange, invoices, wishlist, addresses, notifications, support, settings, sessions, delete account | Built |
| Store portal: dashboard, orders and fulfilment, returns, inventory with movement log, coupons, team invites | Built |
| Detailed product editing: full variant editor, media alt text / ordering / per-variant images / type, change history, duplicate, bulk CSV price & stock update with preview | Built |
| Reports (store and admin): daily sales and orders charts, category revenue, top products, payment mix, status breakdown, fulfilment speed, delivery success, return reasons, coupon performance, product performance table, CSV exports | Built |
| Admin portal: overview, users and roles, invitations, stores, catalog moderation and homepage slots, categories (nesting, order), orders, refunds, delivery partners and shipments, reviews, support, platform coupons, audit log | Built |
| Admin settings: brand, homepage (announcement bar, menu sections and order), shipping, payments and checkout, tax note, delivery, returns and reviews, feature switches (enforced on the server), maintenance, integrations status | Built |
| Delivery portal (mobile-first): assignments, server-enforced status flow, delivery code (OTP), failure reasons, return to sender, history, availability | Built |
| Light / dark / system themes, reduced motion, WebGL fallback, keyboard focus, skip links | Built |
| robots.txt, sitemap.xml, per-page titles, noindex on private pages | Built |

## Set aside until the owner returns

- Logo/favicon upload and editable email templates (brand settings cover text only).
- SMS/WhatsApp notifications and courier APIs.
- Testing and bug fixing (unit, integration, end-to-end, security, accessibility).
- Advanced features: AI assistant, AR/3D product viewers, exploded views, loyalty, gift cards,
  referrals, multiple named wishlists.
- Deployment: hosting, domain, HTTPS, backups, monitoring, CI/CD, PostgreSQL migration.

## Known limitations

- Policy pages are drafts generated from current settings and say so on the page; they need legal review.
- Return pickups are recorded by the store ("items received"); there is no courier pickup flow yet.
- GST is treated as included in prices; invoices note that GSTIN/HSN details are not yet configured.
- Proof-of-delivery photos are not captured yet (code, name and notes are).
