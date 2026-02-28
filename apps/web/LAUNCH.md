# Website launch – what’s done and what to improve

Use this alongside the root [LAUNCH_CHECKLIST.md](../../LAUNCH_CHECKLIST.md).

---

## Done for launch

- **Admin link removed** from public footers (Home, About, Pricing, Waitlist). Admin is still at `/admin`; just not linked on the marketing site.
- **Sitemap** – `app/sitemap.ts` generates `/sitemap.xml` with Home, About, Pricing, Waitlist, Privacy, Terms.
- **Privacy & Terms** – Placeholder pages at `/privacy` and `/terms` with short copy; linked in all footers. Replace with full legal text before or shortly after launch.
- **Open Graph / Twitter** – Layout metadata includes an image (logo) for social shares. For better previews, add a dedicated OG image (e.g. 1200×630) and point `openGraph.images` to it.
- **robots.txt** – Already allows `/` and disallows `/admin/`.
- **Favicon** – Layout sets `icons: { icon: "/logoStrivon.png", apple: "/logoStrivon.png" }`.
- **App flow** – Incomplete profile → `/app/complete-profile`. Feed comment → thread; Share copies link. Thread: post + comments + reply. Inbox/News: "Coming soon". Create: image/space tooltips.
- **404 & error** – `not-found.tsx` and `error.tsx` with clear copy and “Go home”.

---

## Recommended before / after launch

1. **Favicon** – Done: layout uses `/logoStrivon.png`. For a dedicated .ico, add `app/icon.ico` and Next.js will serve it automatically.
2. **Full Privacy & Terms** – Replace placeholder content on `/privacy` and `/terms` with real policies (or link to a lawyer-drafted version). Needed for app stores and for trust.
3. **OG image** – Add a 1200×630 image (e.g. `public/og-image.png`) and set it in `app/layout.tsx` metadata (`openGraph.images`, `twitter.images`) for nicer link previews.
4. **NEXT_PUBLIC_SITE_URL** – Set to your production URL (e.g. `https://strivon.app`) in the hosting env so sitemap, OG URLs, and canonical links are correct.
5. **Analytics** – Optional: add Google Analytics, Plausible, or similar for traffic and waitlist conversion.
6. **Cookie / consent** – If you add analytics or third-party scripts, consider a simple cookie banner or consent flow where required (e.g. GDPR).
7. **Performance** – Run `npm run build` and check Lighthouse (Performance, Accessibility). Background image is already a single JPEG; keep payloads small.
8. **Mobile** – Test all pages on a real phone; tap targets and text size on waitlist and pricing are already responsive.

---

## Quick checks

| Check              | How |
|--------------------|-----|
| Sitemap            | Open `https://your-domain.com/sitemap.xml` |
| OG preview         | Share homepage URL in Slack/Twitter/LinkedIn and check the card |
| Privacy/Terms      | Click “Privacy” and “Terms” in footer on each page |
| 404                | Visit a bad URL (e.g. `/xyz`) and confirm “Go home” works |

Once these are in place, the site is in good shape for launch.
