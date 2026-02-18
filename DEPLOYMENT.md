# Strivon — Deployment & Production

## Environment variables & secrets

- **Local:** Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in values. Never commit `.env`.
- **EAS Build:** Use [EAS Secrets](https://docs.expo.dev/build-reference/variables/#using-secrets-in-environment-variables) for sensitive values:
  - `expo secret:create EXPO_PUBLIC_NEWS_API_KEY --value "your_key"`
  - `expo secret:create EXPO_PUBLIC_FIREBASE_API_KEY --value "..."` (and other Firebase vars if using auth)
  - Reference in `eas.json` under `build.env` or in the EAS dashboard.
- **CI:** Set env vars in your CI (e.g. GitHub Actions) and pass them into `eas build --non-interactive`.

## Versioning

- **App version:** `apps/mobile/app.config.js` → `version: "1.0.0"`.
- **Build numbers:** Set `EXPO_ANDROID_VERSION_CODE` and `EXPO_IOS_BUILD_NUMBER` for each store build (increment for every upload).
- Example: `EXPO_ANDROID_VERSION_CODE=2 EXPO_IOS_BUILD_NUMBER=2 eas build --platform all`.

## Building for production

```bash
# Install EAS CLI if needed
npm install -g eas-cli
eas login

# Configure project (first time)
eas build:configure

# Build
cd apps/mobile
eas build --platform android   # or ios, or all
```

## Submitting to stores

- **EAS Submit:** After a successful build, submit with e.g. `eas submit --platform ios --latest`.
- **App Store / Play Console:** Ensure you have Privacy Policy and Terms URLs (e.g. your website or in-app routes), screenshots, and store listing copy. See `PRODUCTION_CHECKLIST.md` for legal and distribution items.

## Web (if using apps/web)

- Deploy `apps/web` to Vercel, Netlify, or similar.
- Set env vars in the host’s dashboard (e.g. `EXPO_PUBLIC_API_URL`).
- Point your domain and enable HTTPS (usually automatic on these platforms).

## SSL & domain

- For a custom API backend, use HTTPS (e.g. Let’s Encrypt) and set `EXPO_PUBLIC_API_URL` to your `https://` URL.
- For the web app, configure the custom domain in your host’s dashboard.

## Firestore rules

From the repo root (where `firebase.json` and `firestore.rules` live):

```bash
firebase use <your-project-id>   # if not default
firebase deploy --only firestore
```

For production, set **`EXPO_PUBLIC_REQUIRE_AUTH=true`** in your production `.env` or EAS Secrets so unauthenticated users are redirected to sign-in.

## Checklist before first release

- [ ] All secrets in EAS Secrets or CI, not in repo.
- [ ] `EXPO_PUBLIC_REQUIRE_AUTH=true` and Firebase vars set for production.
- [ ] Firestore rules deployed: `firebase deploy --only firestore`.
- [ ] Privacy Policy and Terms URLs reachable (in-app or web).
- [ ] Version and build numbers incremented for the store build.
- [ ] Test a production build locally: `cd apps/mobile && npx expo run:ios` or `run:android` with production env.
