/**
 * Upload media to Firebase Storage quarantine, then create Firestore media doc.
 * Quarantine is write-only: users cannot read back the file until it is approved and moved to public/.
 */
import { ref, uploadBytesResumable, type UploadTaskSnapshot } from 'firebase/storage';
import { getFirebaseStorage, getCurrentUserId } from '@/lib/firebase';
import { createMediaDoc, getUploadCountToday, incrementUploadCountToday, MAX_UPLOADS_PER_DAY } from '@/lib/firestore/media';
import { getFirestoreUser } from '@/lib/firestore/users';
import type { MediaType } from '@/types/media';

const QUARANTINE_PREFIX = 'quarantine';

function getExtension(uri: string, type?: string): string {
  if (type === 'video') return 'mp4';
  if (type === 'image') return 'jpg';
  const lower = uri.split('?')[0].toLowerCase();
  if (lower.endsWith('.mov')) return 'mov';
  if (lower.endsWith('.mp4')) return 'mp4';
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.gif')) return 'gif';
  return 'jpg';
}

export interface UploadMediaResult {
  mediaId: string;
  originalPath: string;
}

/**
 * Upload a file (image or video) to quarantine and create the media document.
 * Returns mediaId and path; use mediaId when creating the post.
 */
export async function uploadMediaToQuarantine(
  uri: string,
  type: MediaType,
  onProgress?: (progress: number) => void
): Promise<UploadMediaResult> {
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  const user = await getFirestoreUser(uid);
  if (user?.banned) throw new Error('Your account cannot upload content.');
  if (user?.status === 'frozen') throw new Error('Your account is frozen. Contact support.');
  const count = await getUploadCountToday(uid);
  if (count >= MAX_UPLOADS_PER_DAY) throw new Error(`Upload limit reached (${MAX_UPLOADS_PER_DAY} per day). Try again tomorrow.`);
  const storage = getFirebaseStorage();
  if (!storage) throw new Error('Storage not configured');

  const mediaId = `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const ext = getExtension(uri, type);
  const originalPath = `${QUARANTINE_PREFIX}/${uid}/${mediaId}/original.${ext}`;

  // Create media doc first (status = processing) so the Storage trigger can update it when file lands
  await createMediaDoc(mediaId, {
    ownerUid: uid,
    type,
    originalPath,
  });
  await incrementUploadCountToday(uid);

  // Fetch the file as blob (Expo/React Native: uri can be file:// or content URI)
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, originalPath);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob, {
      contentType: type === 'video' ? 'video/mp4' : 'image/jpeg',
    });

    task.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const pct = snapshot.totalBytes > 0 ? snapshot.bytesTransferred / snapshot.totalBytes : 0;
        onProgress?.(pct);
      },
      (err) => {
        reject(err);
      },
      () => {
        resolve({ mediaId, originalPath });
      }
    );
  });
}
