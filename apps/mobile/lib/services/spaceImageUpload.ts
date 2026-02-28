import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage, getCurrentUserId } from '@/lib/firebase';

/**
 * Upload a space image (banner or icon) and return the public URL.
 * Used when creating/editing a space with local file URIs.
 */
export async function uploadSpaceImage(
  uri: string,
  kind: 'banner' | 'icon'
): Promise<string> {
  const uid = getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  const storage = getFirebaseStorage();
  if (!storage) throw new Error('Storage not configured');

  const ext = uri.toLowerCase().includes('.png') ? 'png' : 'jpg';
  const path = `spaces/${uid}/${Date.now()}-${kind}.${ext}`;
  const storageRef = ref(storage, path);

  const response = await fetch(uri);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob, {
    contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
  });
  return getDownloadURL(storageRef);
}
