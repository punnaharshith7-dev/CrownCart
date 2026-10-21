# Connecting Google sign-in, Razorpay and email

All three are built. Each one switches on by itself as soon as its keys are in `.env`
and the API restarts. Until then the site says they are "not configured" instead of pretending.

**Put keys in `.env` yourself — never paste them into chat, commit them, or put them in frontend code.**
`.env` is already ignored by git. After editing it, restart the API (stop `npm run dev` and start it again).

Check status any time at **Admin → Settings → Integrations** or `GET /api/health`.

---

## 1. Google sign-in

1. Go to <https://console.cloud.google.com/> → create (or pick) a project.
2. **APIs & Services → OAuth consent screen**: choose *External*, fill in the app name (CrownCart),
   support email, and add scopes `openid`, `email`, `profile`. While it's in *Testing*, add your own
   Google account under **Test users**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → *Web application*.
4. Under **Authorized redirect URIs** add the exact address you open the site on, plus `/api/auth/google/callback`:
   - `http://localhost:5175/api/auth/google/callback` (the port the dev server is using now)
   - `http://localhost:5173/api/auth/google/callback` (the usual port)
   - your live domain later, e.g. `https://crowncart.in/api/auth/google/callback`
5. Copy the client ID and secret into `.env`:
   ```
   GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
   ```

Notes:
- Google only allows `http://` redirects for `localhost`. Google sign-in won't work when the site is opened
  through a LAN address like `http://10.x.x.x:5175` — use `localhost` on this PC, or a real HTTPS domain.
- In production set `PUBLIC_URL` to your domain; the redirect URI is built from it.
- Google sign-in only creates **customer** accounts. If the Google email matches an existing account, it
  is linked (Google has verified the address). Staff roles still come only from admin invitations.

## 2. Razorpay (UPI, cards, net banking, wallets)

1. Sign up at <https://dashboard.razorpay.com/>. You can use **Test mode** immediately, before KYC.
2. **Account & Settings → API Keys → Generate key** (in Test mode first).
3. Put them in `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxx
   ```
4. **Webhooks** (recommended; needed in production): **Account & Settings → Webhooks → Add new webhook**
   - URL: `https://YOUR-DOMAIN/api/payments/razorpay/webhook`
   - Secret: any long random string → also put it in `.env` as `RAZORPAY_WEBHOOK_SECRET=...`
   - Events: `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`

How payment confirmation works (so nothing is faked):
- The server creates the Razorpay order with the server-calculated total.
- After the customer pays, the browser sends Razorpay's signature; the server checks the HMAC signature
  **and** fetches the payment from Razorpay to confirm the amount and status before confirming the order.
- The webhook confirms payments even if the customer closes the tab, and is de-duplicated so repeats
  change nothing.
- Webhooks can't reach `localhost`. Locally, payments still confirm through the browser step. To test
  webhooks locally use a tunnel (e.g. `cloudflared tunnel --url http://localhost:8787`) and register that URL.

Test cards and UPI IDs: <https://razorpay.com/docs/payments/payments/test-card-details/>.
Switch to **Live** keys only after Razorpay activates your account.

## 3. Email (Resend)

1. Sign up at <https://resend.com/> → **API Keys → Create API key** (sending access).
2. **Domains → Add domain** and add the DNS records it shows (SPF/DKIM) at your domain registrar.
   Until a domain is verified, Resend only lets you send *to your own email* from `onboarding@resend.dev`.
3. Put this in `.env`:
   ```
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxxxxx
   EMAIL_FROM=CrownCart <orders@your-verified-domain.com>
   ```
   For a quick test before verifying a domain: `EMAIL_FROM=CrownCart <onboarding@resend.dev>`.
4. Set `PUBLIC_URL` to the address customers use, so links in emails (verify email, reset password,
   invitations, order tracking) point to the right place.

Emails CrownCart sends: email verification, password reset, order confirmation, delivery code when an
order is out for delivery, staff invitations, and support replies to guests. Every email is recorded in
the outbox; failures are marked `failed` with the provider's error (Admin → Email outbox in development).

---

## 4. AI shopping assistant (Claude)

1. Create an API key at <https://console.anthropic.com/> → **API Keys**.
2. `.env`: `ANTHROPIC_API_KEY=sk-ant-...` (optionally `ASSISTANT_MODEL`, default `claude-opus-5-5`).
3. Restart the API. The "✦ Ask CrownCart" button appears on shop pages (not on the homepage).

How it works: Claude searches the live catalog through three read-only tools (search, product details,
categories). It can't see accounts, change bags, place orders or apply discounts, and it is told to recommend
only products the tools return. It runs at low effort to keep replies quick and costs down, is rate-limited
(10 messages / 10 min for guests, 30 for signed-in shoppers), and can be switched off in
Admin → Settings → Features. Each message costs real API usage — watch it in the Anthropic Console.

## 5. SMS & WhatsApp (Twilio)

1. Sign up at <https://www.twilio.com/>. Copy the **Account SID** and **Auth Token**.
2. SMS: buy or register a sender and set `TWILIO_SMS_FROM` (e.g. `+1...` or an approved Indian sender).
   **India:** promotional/transactional SMS to Indian numbers requires DLT registration (entity + templates)
   with a telecom operator before messages are delivered.
3. WhatsApp: enable a WhatsApp sender in Twilio and set `TWILIO_WHATSAPP_FROM` (e.g. `+14155238886` for the
   sandbox). Outside a 24-hour customer conversation, WhatsApp only delivers **pre-approved templates**, so
   register templates matching the three messages (order confirmed, out for delivery with code, delivered).
4. Customers must opt in under **My account → Settings → Text messages**; nothing is sent otherwise.
   Every message is listed in **Admin → SMS & WhatsApp** ("logged" = not sent because no provider is set).

## 6. Courier (Shiprocket)

1. In Shiprocket: **Settings → API → Configure → Create an API user** (a separate email from your login).
   `.env`: `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`.
2. Add your pickup address in Shiprocket and put its exact **name** in Admin → Settings → Courier.
3. Webhook for live tracking: Shiprocket **Settings → API → Webhooks** →
   URL `https://YOUR-DOMAIN/api/shipping/courier-webhook`, token = any long random string, also set as
   `SHIPROCKET_WEBHOOK_TOKEN`. (Shiprocket refuses URLs containing "shiprocket", hence the neutral path.)
4. Stores then see **Book courier** on orders that are ready for dispatch: it creates the Shiprocket order,
   assigns an AWB, schedules pickup and links the label. Tracking updates move the order to shipped,
   out for delivery, delivered or returned-to-sender automatically; "Refresh courier tracking" pulls the
   latest status on demand (useful locally, where webhooks can't reach you).

The in-house delivery-partner flow keeps working alongside the courier: each order uses one or the other.
