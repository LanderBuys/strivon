# EAS Secrets – What they are and how to set them

## What are EAS Secrets?

When you build your app **on Expo’s servers** (for the App Store or Play Store), your app still needs things like:

- **Firebase config** – so the app can talk to your Firebase project (auth, Firestore).
- **Require auth = true** – so production builds force users to sign in.

Those values can’t live in your code or in Git (they’re secret and different per environment). **EAS Secrets** are Expo’s way to store them: you add “name = value” pairs in the EAS Dashboard (or via CLI), and when EAS runs a **production** build, it injects those values as environment variables into your app. So your app gets the right Firebase project and settings without you ever committing secrets.

**In short:** EAS Secrets = where you store your production config (Firebase keys, etc.) so EAS builds can use them safely.

---

## Part 1: Get your Firebase values

Your app needs six values that identify and connect to your Firebase project. You get them from the **Firebase Console**.

### Step 1: Open Firebase and your project

1. Go to **[Firebase Console](https://console.firebase.google.com/)** and sign in.
2. Click your project (the one you use for Strivon). If you haven’t created one yet, create a project first.

### Step 2: Open the “Web app” config

1. Click the **gear icon** next to “Project Overview” → **Project settings**.
2. Scroll to **“Your apps”**.
3. If you don’t have a **Web** app yet:
   - Click **“Add app”** → choose the **</> Web** icon.
   - Give it a nickname (e.g. “Strivon”) and click **Register app**. You can skip the Firebase Hosting steps; we only need the config.
4. In “Your apps”, open your **Web** app. You’ll see a code snippet like this (sometimes under “SDK setup and configuration” → “Config”):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123..."
};
```

### Step 3: Map each value to an EAS Secret

Use this table. **Name** = the EAS Secret name. **Value** = copy exactly from the Firebase config (the value in quotes on the right).

| EAS Secret name | What it is | Where to copy from in Firebase config |
|-----------------|------------|----------------------------------------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Web API key (long string starting with `AIza...`) | `apiKey: "..."` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain (e.g. `myapp.firebaseapp.com`) | `authDomain: "..."` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Project ID (e.g. `myapp-abc123`) | `projectId: "..."` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket (e.g. `myapp.appspot.com`) | `storageBucket: "..."` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Numeric sender ID (digits only) | `messagingSenderId: "..."` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | App ID (e.g. `1:123456789:web:abc...`) | `appId: "..."` |

**Important:** Copy the **values only** (the part in quotes), not the keys. No spaces, no typos.

---

## Part 2: Add the secrets in EAS

You can use either the **Dashboard** (easier) or the **CLI**.

### Option A: EAS Dashboard (recommended)

1. Go to **[expo.dev](https://expo.dev)** and sign in.
2. Open your **Strivon** project (or create/link it if you haven’t yet).
3. In the left sidebar, open **Secrets** (under your project).
4. Click **“Create secret”** (or “Add secret”).
5. For each row below, set **Name** and **Value**, then save.

**Required for production:**

| Name | Value |
|------|--------|
| `EXPO_PUBLIC_REQUIRE_AUTH` | `true` (literally the word true) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | (paste from Firebase `apiKey`) |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | (paste from Firebase `authDomain`) |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | (paste from Firebase `projectId`) |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | (paste from Firebase `storageBucket`) |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (paste from Firebase `messagingSenderId`) |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | (paste from Firebase `appId`) |

**Optional (only if you use them):**

- `EXPO_PUBLIC_API_URL` – your backend API base URL (e.g. `https://api.yourapp.com`).
- `EXPO_PUBLIC_NEWS_API_KEY` – your News API key (if you use the news feature).

After you save, every **production** EAS build will get these values automatically. You don’t need to put them in your repo or in `app.config.js`; EAS injects them at build time.

### Option B: EAS CLI

If you prefer the command line:

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. From the repo root or `apps/mobile`, run (replace `YOUR_VALUE` with the real value from Firebase or the table above):

```bash
eas secret:create --name EXPO_PUBLIC_REQUIRE_AUTH --value "true" --scope project

eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "YOUR_API_KEY" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "YOUR_AUTH_DOMAIN" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "YOUR_PROJECT_ID" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "YOUR_STORAGE_BUCKET" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "YOUR_SENDER_ID" --scope project
eas secret:create --name EXPO_PUBLIC_FIREBASE_APP_ID --value "YOUR_APP_ID" --scope project
```

Use the exact same values you copied from the Firebase config in Part 1.

---

## Quick recap

| Question | Answer |
|----------|--------|
| What are EAS Secrets? | Stored env vars that only EAS builds see; you don’t commit them. |
| Where do Firebase values come from? | Firebase Console → Project settings → Your apps → Web app config. |
| Where do I put them? | Expo dashboard → your project → **Secrets** (or via `eas secret:create`). |
| When are they used? | When you run a **production** EAS build (`eas build --profile production`). |

Once all seven required secrets are set, you’re good to run production builds. For local development you keep using `apps/mobile/.env` (copy from `.env.example`); EAS Secrets are only for builds on Expo’s servers.

---

## Deep linking

The app uses the URL scheme **`mobile`** (set in `app.config.js`). Supported links open the app to the right screen when the app is installed.

| Link | Opens |
|------|--------|
| `mobile://` | App (root) |
| `mobile:///(tabs)` | Main tabs (feed) |
| `mobile:///post/{id}` | Single post |
| `mobile:///thread/{id}` | Thread (comments) |
| `mobile:///profile/{id}` | User profile |
| `mobile:///space/{id}` | Space detail |
| `mobile:///story/{id}` | Story viewer |
| `mobile:///search` | Search |
| `mobile:///search-results?q=...` | Search results |
| `mobile:///chat/{id}` | Chat conversation |

Use these in push notification payloads (`data.link`), emails, or share links. For universal links (https), configure your domain in the Apple/Google developer consoles and wire the same paths.
