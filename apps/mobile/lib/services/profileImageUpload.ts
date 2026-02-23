import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage, getCurrentUserId } from '@/lib/firebase';

/**
 * Upload a profile image (avatar or banner) and return the public URL.
 */
export async function uploadProfileImage(
  uri: string,
  kind: 'avatar' | 'banner'
): Promise<string> {
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  const storage = getFirebaseStorage();
  if (!storage) throw new Error('Storage not configured');

  const ext = uri.toLowerCase().includes('.png') ? 'png' : 'jpg';
  const path = `profile/${uid}/${kind}.${ext}`;
  const storageRef = ref(storage, path);

  const response = await fetch(uri);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob, {
    contentType: kind === 'avatar' ? (ext === 'png' ? 'image/png' : 'image/jpeg') : (ext === 'png' ? 'image/png' : 'image/jpeg'),
  });
  return getDownloadURL(storageRef);
}
