# Strivon — Production Readiness Checklist

Use this to track what’s done and what’s left before launch. Update status as you go.

**Legend:** `[ ]` Not started · `[-]` In progress · `[x]` Done

---

## Authentication

| Status | Item | Notes / Location |
|--------|------|------------------|
| [x] | Authentication system | Firebase Auth in `lib/firebase.ts`, `contexts/AuthContext.tsx`. Sign-in/up in `app/sign-in.tsx`, `app/sign-up.tsx`. Set `EXPO_PUBLIC_FIREBASE_*` in .env. |
| [ ] | User accounts & user data separation | Depends on backend; ensure multi-tenant isolation. |
| [x] | Protected routes | `app/index.tsx` redirects to `/sign-in` when `EXPO_PUBLIC_REQUIRE_AUTH=true` and no user. |
| [x] | Password reset | `app/forgot-password.tsx` + `sendPasswordReset` in AuthContext. |
| [x] | Email verification | `app/verify-email.tsx` + `sendVerificationEmail` in AuthContext. |

---

## Data & API

| Status | Item | Notes / Location |
|--------|------|------------------|
| [ ] | Database (persistent storage) | Backend DB required; mobile currently uses mocks (e.g. `lib/api/*`, `lib/mocks/*`). |
| [x] | API layer | `lib/api/client.ts`: base URL from `EXPO_PUBLIC_API_URL`, rate limiting, timeout, ApiError. |
| [x] | Secure data validation | `lib/validation/schemas.ts` (email, password, handle, etc.). Use in sign-up and forms. |
| [x] | Input sanitization | `lib/utils/sanitize.ts`: sanitizeText, sanitizeEmail, sanitizeHandle, sanitizeForDisplay. |

---

## Security

| Status | Item | Notes / Location |
|--------|------|------------------|
| [ ] | Rate limiting | Implement on backend; optionally client-side backoff in API client. |
| [ ] | Secure secrets storage | Use env vars (e.g. `.env`); never commit secrets. `.env.example` exists in `apps/mobile`. |
| [ ] | Production config | Separate config for dev/staging/prod and env-based API URLs. |

---

## Data Integrity & UX

| Status | Item | Notes / Location |
|--------|------|------------------|
| [x] | Error handling (crash prevention) | `components/ErrorBoundary.tsx` wraps app; add `onRetry` / `onGoHome` where needed. |
| [x] | Form validation | `lib/validation/schemas.ts`; used in sign-up and ProfileEditModal (name, handle, bio). |
| [x] | Loading states | Existing `LoadingSpinner`, `SettingsSkeleton`; sign-in/up/forgot use ActivityIndicator. |
| [x] | Offline handling | `hooks/useOffline.ts` (NetInfo), `components/OfflineBanner.tsx` shown in `_layout.tsx` when offline. |

---

## Monetization

| Status | Item | Notes / Location |
|--------|------|------------------|
| [-] | Subscription system | `contexts/SubscriptionContext.tsx`: plans (free/premium/pro), AsyncStorage; wire to RevenueCat/IAP. |
| [ ] | Payment processing | Integrate Stripe/Apple/Google Pay and keep PCI/PCI-like scope minimal. |
| [x] | Plan-based feature restrictions | `useSubscription().canUseFeature(feature)`, `isPremium`; gate UI by plan. |
| [ ] | Billing management | Subscription status, renewal, upgrade/downgrade, invoices (backend + store). |
| [ ] | Webhook handling | Backend: payment/subscription webhooks (Stripe, app stores). |

---

## Analytics

| Status | Item | Notes / Location |
|--------|------|------------------|
| [x] | User tracking | `analyticsService.setUserId(uid)` called from AuthContext. |
| [x] | Event tracking | `analyticsService.trackEvent(name, props)`, `trackScreen(screenName)`. |
| [x] | Retention tracking | `analyticsService.trackRetention(metric, value)`. Wire to backend. |
| [x] | Funnel tracking | `analyticsService.trackFunnel(name, step, props)`; onboarding completion tracked. |

---

## Performance

| Status | Item | Notes / Location |
|--------|------|------------------|
| [ ] | Production build optimization | Use Expo production build; enable minification and tree-shaking. |
| [x] | Remove debug logs | `babel.config.js`: `transform-remove-console` in production (keeps error/warn). |
| [x] | Image optimization | `expo-image` in use; consider sizes/formats and CDN. |
| [ ] | Code splitting | Expo-router lazy-loads by route; add React.lazy for heavy modals if needed. |
| [x] | Lazy loading | FlatList virtualizes lists; below-fold can use lazy components. |

---

## Legal & Compliance

| Status | Item | Notes / Location |
|--------|------|------------------|
| [x] | Privacy Policy | `app/settings/privacy-policy.tsx`; link in Settings. |
| [x] | Terms of Service | `app/settings/terms.tsx`; link in Settings. |
| [x] | Data compliance (GDPR) | Privacy Policy sect. 5 (rights), 6 (retention); Settings: Export my data, Delete account. |
| [x] | Refund policy | `app/settings/refund-policy.tsx`; Terms sect. 6 + link in Settings. |

---

## Production Setup

| Status | Item | Notes / Location |
|--------|------|------------------|
| [x] | Environment variables | `apps/mobile/.env.example`: API_URL, REQUIRE_AUTH, Firebase, version codes. |
| [ ] | Secure secrets storage | No secrets in repo; use EAS Secrets or CI env for builds. |
| [x] | Versioning system | `app.config.js`: ios.buildNumber, android.versionCode from env. |

---

## Distribution

| Status | Item | Notes / Location |
|--------|------|------------------|
| [ ] | App store preparation (mobile) | Store listings, screenshots, privacy policy URL, EAS Submit. |
| [ ] | Web deployment setup (if web) | `apps/web` exists; configure host (Vercel/Netlify/etc.) and env. |
| [ ] | Domain configuration | Custom domain for API and/or web app. |
| [ ] | SSL configuration | HTTPS for API and web; certificates (e.g. Let’s Encrypt). |

---

## Growth

| Status | Item | Notes / Location |
|--------|------|------------------|
| [x] | Onboarding flow optimization | `app/onboarding.tsx`; funnel step "completed" tracked. |
| [ ] | Email system | Transactional (Firebase verification/reset); add marketing if needed. |
| [-] | Push notifications | `lib/services/notificationService.ts` + expo-notifications; add server-side sending. |
| [x] | Feedback collection system | `app/settings/feedback.tsx` (mailto); "Send Feedback" in Settings. |

---

## Quick reference — Key files

| Area | Path |
|------|------|
| Root layout & notifications | `apps/mobile/app/_layout.tsx` |
| Auth | `apps/mobile/contexts/AuthContext.tsx`, `lib/firebase.ts`, `app/sign-in.tsx`, `app/sign-up.tsx`, `app/forgot-password.tsx`, `app/verify-email.tsx` |
| Protected entry | `apps/mobile/app/index.tsx` |
| Onboarding | `apps/mobile/app/onboarding.tsx` |
| Error boundary | `apps/mobile/components/ErrorBoundary.tsx` |
| API client | `apps/mobile/lib/api/client.ts` |
| API types | `apps/mobile/lib/api/types.ts` (ApiUser, ApiUserProfileUpdate) |
| Users API | `lib/api/users.ts`: getUserById/updateUserProfile use API when API_BASE_URL set |
| Validation & sanitization | `apps/mobile/lib/validation/schemas.ts`, `lib/utils/sanitize.ts` |
| Analytics | `apps/mobile/lib/services/analyticsService.ts` |
| Subscription | `apps/mobile/contexts/SubscriptionContext.tsx` |
| Notifications | `apps/mobile/lib/services/notificationService.ts` |
| Legal | `app/settings/privacy-policy.tsx`, `terms.tsx`, `refund-policy.tsx` |
| Feedback | `app/settings/feedback.tsx` |
| Deployment | `DEPLOYMENT.md` (EAS, secrets, versioning, stores) |
| Env example | `apps/mobile/.env.example` |
| App config | `apps/mobile/app.config.js` |

---

*Last updated: Feb 2025. Update this file as you complete items.*
