import AsyncStorage from '@react-native-async-storage/async-storage';

export type SpaceAnnouncementMediaItem = {
  id: string;
  uri: string;
  type: 'image' | 'video' | 'document' | 'audio';
  thumbnail?: string;
  name?: string;
  mimeType?: string;
  size?: number;
  duration?: number; // seconds, for audio
};

export type SpaceAnnouncement = {
  id: string;
  spaceId: string;
  title: string;
  body: string;
  media?: SpaceAnnouncementMediaItem[];
  createdAt: string;
  updatedAt?: string;
  createdBy: string; // user id
};

const keyForSpace = (spaceId: string) => `@strivon_space_announcements:${spaceId}`;

export async function getSpaceAnnouncements(spaceId: string): Promise<SpaceAnnouncement[]> {
  const raw = await AsyncStorage.getItem(keyForSpace(spaceId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SpaceAnnouncement[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a) => a && a.spaceId === spaceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function createSpaceAnnouncement(
  input: Omit<SpaceAnnouncement, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SpaceAnnouncement> {
  const next: SpaceAnnouncement = {
    id: `ann-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...input,
  };

  const current = await getSpaceAnnouncements(input.spaceId);
  const updated = [next, ...current];
  await AsyncStorage.setItem(keyForSpace(input.spaceId), JSON.stringify(updated));
  return next;
}

export async function deleteSpaceAnnouncement(spaceId: string, announcementId: string): Promise<void> {
  const current = await getSpaceAnnouncements(spaceId);
  const updated = current.filter((a) => a.id !== announcementId);
  await AsyncStorage.setItem(keyForSpace(spaceId), JSON.stringify(updated));
}

export async function updateSpaceAnnouncement(
  spaceId: string,
  announcementId: string,
  updates: Partial<Pick<SpaceAnnouncement, 'title' | 'body' | 'media'>>
): Promise<SpaceAnnouncement | null> {
  const current = await getSpaceAnnouncements(spaceId);
  const idx = current.findIndex((a) => a.id === announcementId);
  if (idx === -1) return null;

  const existing = current[idx];
  const next: SpaceAnnouncement = {
    ...existing,
    ...updates,
    id: existing.id,
    spaceId: existing.spaceId,
    createdAt: existing.createdAt,
    createdBy: existing.createdBy,
    updatedAt: new Date().toISOString(),
  };

  const updated = [...current];
  updated[idx] = next;

  await AsyncStorage.setItem(keyForSpace(spaceId), JSON.stringify(updated));
  return next;
}

