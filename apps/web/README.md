# Strivon Web

Marketing site and admin dashboard for Strivon (Next.js 16, React 19, Tailwind CSS 4). Public: Home, About, Dashboard. Admin: `/admin` (Firebase Auth, reports). See [FIREBASE_ENV.md](FIREBASE_ENV.md) and [scripts/README-ADMIN.md](../../scripts/README-ADMIN.md).

## Getting Started

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For admin, set `.env.local` with `NEXT_PUBLIC_FIREBASE_*`.

## Build and deploy

```bash
npm run build && npm start
```

Set env vars on your host (e.g. Vercel). See root [LAUNCH_CHECKLIST.md](../../LAUNCH_CHECKLIST.md) and [DEPLOYMENT.md](../../DEPLOYMENT.md).
