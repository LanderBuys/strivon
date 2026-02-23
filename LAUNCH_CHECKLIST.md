# Strivon – Launch checklist for real users

Use this checklist before releasing to production (App Store, Play Store, or web).

---

## 0. Code & build verification

Before release, run:

- **Mobile typecheck:** `cd apps/mobile && npm run typecheck` (must pass).
- **Mobile lint:** `cd apps/mobile && npm run lint` (must pass; 0 errors).
- **Web build:** `cd apps/web && npm run build` (must pass).

The following are already in place:

- **Firestore rules** – `firestore.rules` is present; all collections require `request.auth != null` (no public read/write).
- **Auth** – `app.config.js` passes `EXPO_PUBLIC_REQUIRE_AUTH` into `extra.requireAuth`; `app/index.tsx` redirects to sign-in when `requireAuth && isFirebaseEnabled` and user is null.
- **EAS** – `eas.json` has `production` and `preview` profiles with `EXPO_PUBLIC_REQUIRE_AUTH: "true"`.
- **Secrets** – `.env` is in root and `apps/mobile/.gitignore`; use `apps/mobile/.env.example` as template. Production values go in EAS Secrets, not in repo.
- **Web** – `npm run build` in `apps/web` succeeds (Next.js 16).
- **Mobile assets** – `app.config.js` uses a single asset: `./assets/logoStrivon.png` for icon, splash, adaptive icon, and favicon.

---

## 1. Environment & secrets

- [ ] **Never commit `.env`** – It is in `.gitignore`. Use `.env.example` as a template.
- [ ] **Production env vars** – Set in **EAS Secrets** (Dashboard or CLI). See **[apps/mobile/EAS_SECRETS_SETUP.md](apps/mobile/EAS_SECRETS_SETUP.md)** for the exact variable names and commands.
  - Set **all** Firebase vars: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`.
  - Set **`EXPO_PUBLIC_REQUIRE_AUTH=true`** (already applied in `eas.json` for production builds; add to EAS Secrets so it’s explicit).
  - Optional: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_NEWS_API_KEY`.

---

## 2. Firebase

- [ ] **Firestore rules** deployed:
  ```bash
  firebase deploy --only firestore
  ```
- [ ] **Firebase Console**: Auth sign-in methods enabled (Email/Password, Google, etc.) as needed.
- [ ] **Firebase Console**: Add your production app bundle IDs / package names if not already added.

---

## 3. Mobile app assets (Expo)

The app uses **one asset** (via `app.config.js`): **`apps/mobile/assets/logoStrivon.png`**.

- [ ] **`logoStrivon.png`** present in `apps/mobile/assets/` (recommended **1024×1024px**; used for icon, splash, Android adaptive icon, web favicon, and notification icon).

See `apps/mobile/assets/README.md` for guidance. Without it, builds may fail. For placeholder-only assets (e.g. CI), run `npm run create-assets` in `apps/mobile` (this creates **logoStrivon.png**); for production, use your real **logoStrivon.png** (1024×1024) with the existing `app.config.js`.

---

## 4. EAS Build (iOS & Android)

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Log in: `eas login`
- [ ] Configure project (first time): `eas build:configure` (from repo root or `apps/mobile`)
- [ ] Set **production env vars in EAS** (Dashboard → Project → Secrets) so they are injected for production builds.
- [ ] Build:
  ```bash
  cd apps/mobile
  eas build --platform ios --profile production
  eas build --platform android --profile production
  ```
- [ ] Submit to stores (after builds succeed): fill in `apps/mobile/eas.json` → `submit.production` with your Apple ID, ASC App ID, Apple Team ID, and Android service account key path + track, then:
  ```bash
  eas submit --platform ios --profile production
  eas submit --platform android --profile production
  ```

---

## 5. Web app (Next.js)

- [ ] For admin (Firebase): set `NEXT_PUBLIC_FIREBASE_*` (and optionally `NEXT_PUBLIC_APP_STORE_URL`, `NEXT_PUBLIC_PLAY_STORE_URL`, `NEXT_PUBLIC_SITE_URL`) on your host. See [apps/web/FIREBASE_ENV.md](apps/web/FIREBASE_ENV.md).
- [ ] Build and run locally to verify:
  ```bash
  cd apps/web
  npm run build
  npm start
  ```
- [ ] Deploy (e.g. Vercel: connect repo and deploy; or your own server with `npm run build && npm start`).

---

## 6. Before going live

- [ ] Test sign-up and sign-in on a real device (or simulator) with production Firebase.
- [ ] Test critical flows: feed, posts, notifications, offline behavior.
- [ ] Confirm Firestore rules: no public read/write on sensitive collections; only authenticated users where intended.
- [ ] Ensure `EXPO_PUBLIC_REQUIRE_AUTH=true` in production so unauthenticated users cannot use the app without signing in.

---

## Quick reference

| Item              | Where / Command                                      |
|-------------------|------------------------------------------------------|
| Env template      | `apps/mobile/.env.example`                            |
| Firestore deploy  | `firebase deploy --only firestore`                   |
| EAS config        | `apps/mobile/eas.json`                               |
| Production build  | From repo root: `cd apps/mobile` then `eas build --platform all --profile production` |
| Web build         | From repo root: `cd apps/web` then `npm run build` and `npm start` |
| Mobile typecheck  | `cd apps/mobile` then `npm run typecheck`            |

Once every item above is done, the app is set up for launch to real users.
