# Media Moderation Pipeline

This doc describes the upload → quarantine → AI scan → approve/needs_review/reject flow and what’s implemented vs. what to add next.

## Implemented (foundation)

### 1. Firestore data model

- **media/{mediaId}**: `ownerUid`, `type` (image|video), `status` (processing|approved|needs_review|rejected), `storage.originalPath` / `storage.publicPath`, `moderation` (goreScore, flags, provider, reviewedBy, reviewedAt).
- **posts/{postId}**: `ownerUid`, `mediaId`, `visibility` (public|private), `status` (draft|processing|published|rejected). Feed only shows posts with status published (or legacy posts without status).
- **moderationQueue/{mediaId}**: optional queue for needs_review (mediaId, createdAt, priority).
- **uploadCounts/{uid_date}**: daily upload count for rate limit (e.g. 50/day).

### 2. Storage layout and rules

- **quarantine/{uid}/{mediaId}/original.ext**: write-only for `uid`; no reads for anyone (clients cannot distribute unmoderated content).
- **public/{uid}/{mediaId}.ext**: readable by everyone; writes only by backend (Cloud Functions).

Rules: `storage.rules`. Deploy: `firebase deploy --only storage`.

### 3. Posting flow (mobile)

- With media: upload file to quarantine → create media doc (processing) → create post with `mediaId`, `status: processing`, `visibility: private`. Post does not appear in feed until approved.
- Without media: post created as `published` / `public` as before.
- Rate limit and banned/frozen checks run before upload.

### 4. Cloud Functions (`functions/`)

- **onQuarantineFinalize**: on file in `quarantine/`:
  - Creates/updates `media` doc, then runs **stub** moderation (no real PhotoDNA/gore API yet).
  - Stub sets `needs_review` or `approved`/`rejected` with placeholder scores.
  - If approved: copies file to `public/`, updates media + linked posts (status published, media URL).
  - If rejected: deletes quarantine file, sets media + posts rejected.
- **approveMedia(mediaId)** (callable, admin): move to public, set approved, publish linked posts.
- **rejectMedia(mediaId)** (callable, admin): delete quarantine file, set rejected.
- **banUser(uid)** (callable, admin): set `users/{uid}.banned = true`.

Deploy: `cd functions && npm install && npm run build && firebase deploy --only functions`.

### 5. Admin moderation UI (Next.js)

- **/admin/moderation**: lists media with `status === "needs_review"` (scores, flags, owner). Buttons: Approve, Reject, Ban user. No preview (quarantine is unreadable by clients; add a callable that returns a signed URL if you need thumbnails).

### 6. Enforcement

- **Firestore**: media/post create denied if `users/{uid}.banned == true`.
- **Client**: before upload, check user not banned/frozen and daily upload count &lt; 50.
- **users**: admins can set `banned` and `status` (e.g. `frozen` on CSAM match).

---

## Next steps (actual moderation)

### This week

1. **Replace stub with real checks**
   - In `onQuarantineFinalize` (or a separate Cloud Run job):
     - **PhotoDNA** (or equivalent) on images and on video frames for CSAM; set `moderation.csamHashMatch`. If true → reject + freeze user (set `users/{uid}.status = "frozen"`, optionally revoke tokens).
     - **Gore/violence**: call one provider (e.g. Hive Moderation or AWS Rekognition), get scores, set `moderation.goreScore` (and optional `sexualScore`, `flags`).
   - Apply your thresholds, e.g.:
     - `csamHashMatch === true` → REJECT + freeze.
     - `goreScore >= 0.85` → REJECT.
     - `0.55 <= goreScore < 0.85` → NEEDS_REVIEW.
     - &lt; 0.55 → APPROVE.

2. **Video frames**
   - For video, use **Cloud Run** “video scanner”:
     - Cloud Function on quarantine finalize calls Cloud Run with `bucket + objectPath` and `mediaId`.
     - Cloud Run: download video, extract frames (e.g. 1 frame per 1–2 s with ffmpeg), run PhotoDNA + gore on frames, write result to Firestore.
   - Alternatively, use a video moderation API that accepts a URL (e.g. signed quarantine URL from Cloud Function) if your provider supports it.

3. **Indexes**
   - If you use `orderBy("createdAt")` on `media` with `where("status", "==", "needs_review")`, create the composite index in Firebase Console when prompted.

### After launch

- Admin audit logs for approve/reject/ban.
- “Report content” button and report queue (you already have reports; wire to posts/media).
- Optional: signed preview URL callable for admin so moderators can view quarantine media in the admin UI.

---

## Quick reference

| Deploy | Command |
|--------|--------|
| Firestore rules | `firebase deploy --only firestore` |
| Storage rules | `firebase deploy --only storage` |
| Functions | `cd functions && npm run build && firebase deploy --only functions` |

Admin: add emails to Firestore `config/admins` document field `emails` (array of strings).
