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
