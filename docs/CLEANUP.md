# Cleanup summary

## Completed (recent)

### Removed unused files

**Web**
- `apps/web/lib/waitlist.ts` – Waitlist page uses Firestore directly; helper was never imported.
- `apps/web/app/dashboard/page.tsx` – Replaced with a redirect to `/app` (route kept for existing links).

**Mobile**
- `apps/mobile/components/spaces/SpaceEvents.tsx` – Never imported; space detail uses API + inline UI.
- `apps/mobile/components/inbox/InboxFilterChips.tsx` – Never imported; inbox uses `applyInboxFilters` util.
- `apps/mobile/components/create/PostTemplates.tsx` – Never imported.
- `apps/mobile/components/ui/ShimmerText.tsx` – Never imported.
- `apps/mobile/components/thread/QuickReactions.tsx` – Never imported.
- `apps/mobile/components/ui/Badge.tsx` – Count badge component; all “badge” usage is types/badges or inline styles.
- `apps/mobile/components/search/PeopleSearch.tsx` – Never imported.
- `apps/mobile/components/settings/SettingItemSkeleton.tsx` – Never imported; `SettingsSkeleton` uses `SkeletonLoader`.
- `apps/mobile/lib/services/profileDraftService.ts` – Never imported.
- `apps/mobile/lib/utils/logger.ts` – Never imported.

### Config
- Root `package.json`: removed `packages/*` from `workspaces` (no `packages/` directory).

---

## Future consolidation (optional)

- **Shared types:** `User`, `Post`, `PostMedia`, `Space` (and related) live in both `apps/web/types/post.ts` and `apps/mobile/types/post.ts`. Consider a shared `packages/types` (or similar) and re-add `packages/*` to workspaces.
- **Firestore/API:** `lib/firestore/users.ts`, `lib/api/users.ts`, and equivalents for spaces/posts are duplicated across web and mobile; shared client or packages could reduce drift.
- **Formatting:** Relative time (web `lib/format.ts`, mobile `lib/utils/time.ts`) and email sanitization (web `lib/utils/auth.ts`, mobile `lib/utils/sanitize.ts`) could be shared utilities.
