# Firebase env for web (admin dashboard)

The admin dashboard needs Firebase config in `apps/web/.env.local`. **All six values must be non-empty** or you'll see "Firebase is not configured."

## Where to get the values

1. Open [Firebase Console](https://console.firebase.google.com) and select your project (e.g. **strivon_e9ca5**).
2. Click the **gear** → **Project settings**.
3. Under **Your apps**:
   - If you see a **Web** app, click it and copy the values from the `firebaseConfig` snippet.
   - If you don't have a Web app, click **Add app** → **Web** (</>). You'll get a config with `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
4. Put them in `apps/web/.env.local` like this (no quotes):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...
```

5. **Restart** the web dev server (stop and start `npm run dev`) so Next.js loads the new env.

### Avoid "Access denied" on admin

The admin area checks Firestore `config/admins` for a list of allowed emails. If you haven’t set that up (or don’t want to), add your login email to `.env.local` so the app treats you as admin without Firestore:

```
NEXT_PUBLIC_ADMIN_EMAIL=your@email.com
```

Use the **exact same email** you use to sign in at `/admin/login`. For multiple admins use comma-separated emails. Restart the dev server after changing this.

## Option: Copy from mobile .env

If `apps/mobile/.env` already has the Firebase vars filled in, from the **repo root** run:

```bash
node scripts/copy-firebase-env-to-web.js
```

Then restart the web dev server. If you still see "Firebase is not configured", the mobile `.env` had empty values—use Firebase Console as above.

---

## Waitlist API (server-side)

The **Join the waitlist** form submits to `POST /api/waitlist`, which writes to Firestore using the Firebase Admin SDK. For this to work, set **one** of the following in `apps/web/.env.local`:

### Option A: Service account JSON string

1. In Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**.
2. Put the entire JSON (as a single line or escaped) in an env var:
   - `FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}`  
   (In production hosts like Vercel, paste the full JSON in the secret value.)

### Option B: Separate env vars

From the same service account JSON, set:

- `FIREBASE_CLIENT_EMAIL` = `client_email` value
- `FIREBASE_PRIVATE_KEY` = `private_key` value (keep the `\n` as literal backslash-n, or replace with real newlines)

You already have `NEXT_PUBLIC_FIREBASE_PROJECT_ID` from the client config.

After adding these, restart the dev server. If the API is not configured, the form will show: *"Waitlist is not available. Please try again later."*

**Enable Firestore API:** If you see *"Firestore is not enabled"* or a server log `PERMISSION_DENIED: Cloud Firestore API has not been used...`, enable the API once: open [Cloud Firestore API](https://console.developers.google.com/apis/api/firestore.googleapis.com/overview) and ensure your Firebase project (e.g. **strivon-e9ca5**) is selected, then click **Enable**. Wait a minute and retry.

**Create Firestore database:** If you see *"Firestore database not found"* or a server log `Error: 5 NOT_FOUND`, the Firestore database has not been created yet. In [Firebase Console](https://console.firebase.google.com) → your project → **Build** → **Firestore Database** → **Create database**. Choose production mode (you can add rules later), pick a region, then create. After it’s created, retry the waitlist form.
