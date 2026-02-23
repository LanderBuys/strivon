/**
 * Moderation pipeline:
 * - onQuarantineFinalize: when file lands in quarantine/, update media doc and run moderation (stub or call Cloud Run).
 * - approveMedia (callable): move file to public/, set media + post approved.
 * - rejectMedia (callable): delete quarantine file, set media + post rejected.
 * - banUser (callable): set users/{uid}.banned = true.
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";

admin.initializeApp();

const db = admin.firestore();
const bucket = () => getStorage().bucket();

const MEDIA = "media";
const POSTS = "posts";
const MODERATION_QUEUE = "moderationQueue";
const USERS = "users";
const QUARANTINE_PREFIX = "quarantine";
const PUBLIC_PREFIX = "public";

// Stub thresholds (replace with real PhotoDNA + gore API later)
const GORE_REJECT = 0.85;
const GORE_REVIEW = 0.55;

type MediaStatus = "processing" | "approved" | "needs_review" | "rejected";

/** Trigger when a file is uploaded to quarantine. Creates/updates media doc and runs stub moderation. */
export const onQuarantineFinalize = functions.storage
  .object()
  .onFinalize(async (object) => {
    const name = object.name || "";
    if (!name.startsWith(QUARANTINE_PREFIX + "/")) return null;

    const parts = name.split("/");
    if (parts.length < 4) return null;
    const uid = parts[1];
    const mediaId = parts[2];
    const fileName = parts[3] || "";

    const mediaRef = db.collection(MEDIA).doc(mediaId);
    const snap = await mediaRef.get();

    const originalPath = name;
    const updates: Record<string, unknown> = {
      status: "processing",
      "storage.originalPath": originalPath,
    };

    if (!snap.exists) {
      const isVideo = /\.(mp4|mov|webm|avi)$/i.test(fileName);
      updates.ownerUid = uid;
      updates.type = isVideo ? "video" : "image";
      updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
      updates.storage = { originalPath };
      await mediaRef.set(updates);
    } else {
      await mediaRef.update(updates);
    }

    // Stub moderation: no real API yet. Set needs_review so admin can test flow.
    // In production: call PhotoDNA on image/frames, gore API, then set status + moderation fields.
    const stubGoreScore = 0.3;
    const stubCsam = false;
    let status: MediaStatus = "approved";
    if (stubCsam) status = "rejected";
    else if (stubGoreScore >= GORE_REJECT) status = "rejected";
    else if (stubGoreScore >= GORE_REVIEW) status = "needs_review";

    const moderationUpdate: Record<string, unknown> = {
      status,
      moderation: {
        goreScore: stubGoreScore,
        provider: "stub",
        flags: status === "needs_review" ? ["stub_review"] : [],
      },
    };

    if (status === "needs_review") {
      await db.collection(MODERATION_QUEUE).doc(mediaId).set({
        mediaId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        priority: 0,
      });
    }

    if (status === "approved") {
      // Move file to public and set publicPath (see moveToPublic below)
      const ext = fileName.includes(".") ? fileName.replace(/^.*\./, "") : "mp4";
      const publicPath = `${PUBLIC_PREFIX}/${uid}/${mediaId}.${ext}`;
      const b = bucket();
      const src = b.file(originalPath);
      const dest = b.file(publicPath);
      await src.copy(dest);
      await src.delete();
      moderationUpdate["storage.publicPath"] = publicPath;
      moderationUpdate["storage.originalPath"] = admin.firestore.FieldValue.delete();
      // Update any post linking this media
      const postsSnap = await db.collection(POSTS).where("mediaId", "==", mediaId).get();
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${b.name}/o/${encodeURIComponent(publicPath)}?alt=media`;
      for (const d of postsSnap.docs) {
        await d.ref.update({
          status: "published",
          visibility: "public",
          media: [
            {
              id: mediaId,
              type: object.contentType?.startsWith("video") ? "video" : "image",
              url: publicUrl,
            },
          ],
        });
      }
    } else if (status === "rejected") {
      const b = bucket();
      try {
        await b.file(originalPath).delete();
      } catch {
        // ignore
      }
      const postsSnap = await db.collection(POSTS).where("mediaId", "==", mediaId).get();
      for (const d of postsSnap.docs) {
        await d.ref.update({ status: "rejected" });
      }
    }

    await mediaRef.update(moderationUpdate);
    return null;
  });

function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return Promise.resolve(false);
  return db
    .collection("config")
    .doc("admins")
    .get()
    .then((snap) => {
      const emails: string[] = snap.exists ? (snap.data()?.emails || []) : [];
      return emails.some((e: string) => String(e).trim().toLowerCase() === email.trim().toLowerCase());
    });
}

/** Callable: approve media (move to public, set post published). Admin only. */
export const approveMedia = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in required");
  const ok = await isAdmin(context.auth.token.email);
  if (!ok) throw new functions.https.HttpsError("permission-denied", "Admin only");

  const mediaId = data?.mediaId;
  if (typeof mediaId !== "string") throw new functions.https.HttpsError("invalid-argument", "mediaId required");

  const mediaRef = db.collection(MEDIA).doc(mediaId);
  const mediaSnap = await mediaRef.get();
  if (!mediaSnap.exists) throw new functions.https.HttpsError("not-found", "Media not found");

  const d = mediaSnap.data()!;
  const ownerUid = d.ownerUid as string;
  const originalPath = (d.storage as { originalPath?: string })?.originalPath;
  if (!originalPath) throw new functions.https.HttpsError("failed-precondition", "No quarantine path");

  const ext = originalPath.includes(".") ? originalPath.replace(/^.*\./, "") : "mp4";
  const publicPath = `${PUBLIC_PREFIX}/${ownerUid}/${mediaId}.${ext}`;
  const b = bucket();
  const src = b.file(originalPath);
  const dest = b.file(publicPath);
  await src.copy(dest);
  await src.delete();

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${b.name}/o/${encodeURIComponent(publicPath)}?alt=media`;
  await mediaRef.update({
    status: "approved",
    "storage.publicPath": publicPath,
    "storage.originalPath": admin.firestore.FieldValue.delete(),
    "moderation.reviewedBy": context.auth.uid,
    "moderation.reviewedAt": admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection(MODERATION_QUEUE).doc(mediaId).delete();

  const postsSnap = await db.collection(POSTS).where("mediaId", "==", mediaId).get();
  const type = (d.type as string) || "image";
  for (const doc of postsSnap.docs) {
    await doc.ref.update({
      status: "published",
      visibility: "public",
      media: [{ id: mediaId, type, url: publicUrl }],
    });
  }

  return { ok: true };
});

/** Callable: reject media (delete file, set rejected). Admin only. */
export const rejectMedia = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in required");
  const ok = await isAdmin(context.auth.token.email);
  if (!ok) throw new functions.https.HttpsError("permission-denied", "Admin only");

  const mediaId = data?.mediaId;
  if (typeof mediaId !== "string") throw new functions.https.HttpsError("invalid-argument", "mediaId required");

  const mediaRef = db.collection(MEDIA).doc(mediaId);
  const mediaSnap = await mediaRef.get();
  if (!mediaSnap.exists) return { ok: true };

  const d = mediaSnap.data()!;
  const originalPath = (d.storage as { originalPath?: string })?.originalPath;
  if (originalPath) {
    try {
      await bucket().file(originalPath).delete();
    } catch {
      // ignore
    }
  }

  await mediaRef.update({
    status: "rejected",
    "moderation.reviewedBy": context.auth.uid,
    "moderation.reviewedAt": admin.firestore.FieldValue.serverTimestamp(),
  });
  await db.collection(MODERATION_QUEUE).doc(mediaId).delete();

  const postsSnap = await db.collection(POSTS).where("mediaId", "==", mediaId).get();
  for (const doc of postsSnap.docs) {
    await doc.ref.update({ status: "rejected" });
  }

  return { ok: true };
});

/** Callable: ban user. Admin only. */
export const banUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in required");
  const ok = await isAdmin(context.auth.token.email);
  if (!ok) throw new functions.https.HttpsError("permission-denied", "Admin only");

  const uid = data?.uid;
  if (typeof uid !== "string") throw new functions.https.HttpsError("invalid-argument", "uid required");

  await db.collection(USERS).doc(uid).set({ banned: true }, { merge: true });
  return { ok: true };
});
