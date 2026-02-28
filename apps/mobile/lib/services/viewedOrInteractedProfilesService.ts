import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@strivon_viewed_interacted_profile_ids';
const MAX_IDS = 50;

/** Get profile IDs the user has viewed or interacted with (e.g. liked/saved their post), most recent first. */
export async function getViewedOrInteractedAuthorIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Add a profile ID (e.g. when user views a profile). Deduplicates and keeps most recent. */
export async function addViewedProfileId(profileId: string): Promise<void> {
  if (!profileId || profileId.trim() === '') return;
  try {
    const ids = await getViewedOrInteractedAuthorIds();
    const next = [profileId.trim(), ...ids.filter((id) => id !== profileId.trim())].slice(0, MAX_IDS);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

/** Add a profile ID (e.g. when user likes or saves their post). */
export async function addInteractedAuthorId(authorId: string): Promise<void> {
  if (!authorId || authorId.trim() === '') return;
  try {
    const ids = await getViewedOrInteractedAuthorIds();
    const next = [authorId.trim(), ...ids.filter((id) => id !== authorId.trim())].slice(0, MAX_IDS);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
