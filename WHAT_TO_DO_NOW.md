# What to do now to finish the app

Prioritized list. Do **Phase 1** to ship a testable app; **Phase 2** for a real backend; **Phase 3** for store launch and growth.

---

## Phase 1 — Ship something (no backend yet)

You can run and test the app end-to-end with mocks. Do this first.

| # | Task | How |
|---|------|-----|
| 1 | **Run the app** | `npm run dev:mobile` from repo root. Try all main flows (onboarding, feed, profile, spaces, report queue, settings). |
| 2 | **Optional: turn on auth** | Copy `apps/mobile/.env.example` → `apps/mobile/.env`. Create a [Firebase project](https://console.firebase.google.com), enable Email/Password sign-in, add your web app and copy the config into `.env` as `EXPO_PUBLIC_FIREBASE_*`. Set `EXPO_PUBLIC_REQUIRE_AUTH=true` if you want sign-in required. |
| 3 | **Fix any broken flows** | Use the app as a real user; fix bugs, missing screens, or confusing UX. |
| 4 | **Decide: demo vs production** | **Demo:** Keep mocks, use for pitches or TestFlight with “data is fake.” **Production:** You need Phase 2 (backend). |

---

## Phase 2 — Backend (required for real users)

Right now posts, users, spaces, chat, reports, etc. are mocks or local storage. To have real data and multi-user:

| # | Task | How |
|---|------|-----|
| 1 | **Choose backend** | Option A: Firebase (Firestore, Auth already in app). Option B: Your own API (Node/Python/Go + PostgreSQL, etc.). |
| 2 | **Database** | Define and create tables/collections: users, posts, spaces, members, messages, reports, etc. |
| 3 | **API** | Implement REST or GraphQL: auth (or use Firebase Auth + custom tokens), CRUD for users, posts, spaces, chat, and a **reports** endpoint so the report queue can load/save from the server. |
| 4 | **Point app at API** | Set `EXPO_PUBLIC_API_URL=https://your-api.com` in `.env`. `lib/api/client.ts` and `lib/api/users.ts` already use it; replace other mocks in `lib/api/*` and `lib/services/reportQueueService.ts` with real API calls. |
| 5 | **User data separation** | Every API call must be scoped by user/tenant (e.g. Firebase rules or your API auth) so users only see/edit their own data where intended. |

---

## Phase 3 — Store launch and growth

| # | Task | How |
|---|------|-----|
| 1 | **Secrets** | Use [EAS Secrets](https://docs.expo.dev/build-reference/variables/) for API keys and Firebase config in production builds. See `DEPLOYMENT.md`. |
| 2 | **Production build** | `cd apps/mobile && eas build --platform all` (after `eas build:configure` and `eas login`). |
| 3 | **App store prep** | App Store Connect / Google Play: app name, description, screenshots, **Privacy Policy URL** (e.g. your site or in-app route), **Terms** link. |
| 4 | **Submit** | `eas submit --platform ios --latest` (and same for Android). |
| 5 | **Payments (if you want paid features)** | Wire `SubscriptionContext` and `subscriptionService` to RevenueCat or Apple/Google IAP; add webhooks on your backend for subscription events. |
| 6 | **Analytics backend** | Send `analyticsService.trackEvent` / `trackFunnel` to your analytics (e.g. Firebase Analytics, Mixpanel, or your API). |
| 7 | **Push** | Backend: store push tokens and send notifications via FCM/APNs. App already has `notificationService` and Expo Notifications. |

---

## Quick decision tree

- **“I want to test the app on my phone”** → Phase 1 only.
- **“I want real users and real data”** → Phase 1, then Phase 2.
- **“I want it on the App Store”** → Phase 1 + Phase 3 (and Phase 2 if you want real data).
- **“I want to charge for premium”** → Phase 2 (for entitlements) + Phase 3 (payments + webhooks).

---

## Checklist summary

| Done in app | You still do |
|-------------|--------------|
| Auth (Firebase), sign-in/up, reset, verify | Create Firebase project, add env vars |
| API client, validation, sanitization | Build backend and DB |
| Report queue (review, remove/dismiss) | Move reports to backend when you have API |
| Legal (Privacy, Terms, GDPR, Refund) | Publish policy URLs for stores |
| Env example, versioning, deployment notes | EAS secrets, store listing, submit |
| Subscription context + feature gating | RevenueCat/IAP + billing backend |

Use **PRODUCTION_CHECKLIST.md** for the full list and **DEPLOYMENT.md** for build/submit steps.
