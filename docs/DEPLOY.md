# Deploying CrownCart (two copies, free plans)

Each copy has its own frontend, backend and database. They start with the same data and then run separately.

| Part | Service | Copy 1 | Copy 2 |
|---|---|---|---|
| Frontend | Vercel | `crowncart-1` | `crowncart-2` |
| Backend | Render (`render.yaml`) | `crowncart-1` | `crowncart-2` |
| Database | Turso | `crowncart-1` | `crowncart-2` |
| Uploaded files | Cloudinary | shared account | shared account |

## 1. Turso and Cloudinary

1. At turso.tech, create two empty databases, `crowncart-1` and `crowncart-2`. Create an auth token for each.
2. At cloudinary.com, create an account and note the cloud name, API key and API secret.
3. Create `.env.copy1` and `.env.copy2` in the project folder (git ignores them):

   ```
   TURSO_DATABASE_URL=libsql://...
   TURSO_AUTH_TOKEN=...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

## 2. Import the data

Run once per copy. The source is opened read-only, a target that already has tables is refused, and every row is read back and compared.

```
node --env-file=.env.copy1 --disable-warning=ExperimentalWarning server/scripts/import-to-turso.ts server/data/crowncart.db public/uploads "$TURSO_DATABASE_URL"
```

Pass the `libsql://` URL of that copy as the last argument.

## 3. Render

New > Blueprint, pick this repo and branch. For each service enter the Turso and Cloudinary values of that copy. For now set `PUBLIC_URL` and `APP_ORIGIN` to `https://<vercel project name>.vercel.app`.

Also add any integrations in use from your local `.env`: `RAZORPAY_*`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `ADMIN_EMAIL`, `SMTP_*`, `RESEND_API_KEY`, `GOOGLE_*`, `MICROSOFT_*`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `SMS_PROVIDER`, `TEXTBEE_*`, `TWILIO_*`, `SHIPROCKET_*`.

## 4. Vercel

Import this repo twice, with the project names from the table and this branch as the production branch. On each, set `API_ORIGIN` to that copy's Render URL, for example `https://crowncart-1.onrender.com`. `vercel.json` handles the rest.

If Vercel gives a project a different address, update `PUBLIC_URL` and `APP_ORIGIN` on its Render service to match.

## 5. Outside services, per copy

- Google and Microsoft sign-in: add `https://<site>/api/auth/google/callback` and `https://<site>/api/auth/microsoft/callback`.
- Razorpay webhook: `https://<site>/api/payments/razorpay/webhook`.
- Shiprocket webhook: `https://<site>/api/shipping/courier-webhook`.

## Limits to keep in mind

- Run only one backend process per database. Order and stock safety relies on it.
- The free Render plan sleeps when idle, so the first API request after a quiet spell is slow.
- Cloudinary's free plan has its own file size limits. A file over the limit is refused with a clear message.
