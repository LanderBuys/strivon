/**
 * Placeholder and fallback URLs. Override via env for production (e.g. your CDN).
 * Used for avatars, story placeholders, and default images when content has none.
 */

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
const fromEnv = (key: string, fallback: string): string =>
  extra?.[key] ?? (typeof process !== 'undefined' && (process as NodeJS.Process).env?.[key]) ?? fallback;

export const PlaceholderUrls = {
  /** Default avatar when user has no photo (seed for deterministic avatar) */
  avatar: (seed?: string) =>
    fromEnv('EXPO_PUBLIC_PLACEHOLDER_AVATAR', `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed || 'default')}`),
  /** Single generic avatar URL (e.g. for lists) */
  avatarGeneric: () =>
    fromEnv('EXPO_PUBLIC_PLACEHOLDER_AVATAR_GENERIC', 'https://i.pravatar.cc/150?u=default'),
  /** Story image placeholder when media fails or is missing */
  storyImage: (id?: string) =>
    fromEnv('EXPO_PUBLIC_PLACEHOLDER_STORY', `https://picsum.photos/400/800?random=${id || '1'}`),
  /** Generic image placeholder (e.g. "Story" text placeholder) */
  imagePlaceholder: () =>
    fromEnv('EXPO_PUBLIC_PLACEHOLDER_IMAGE', 'https://via.placeholder.com/400x800/000000/FFFFFF?text=Story'),
};

/** Web app base URL for pricing and marketing (override via EXPO_PUBLIC_WEB_APP_URL) */
export const WebAppUrls = {
  pricing: () => fromEnv('EXPO_PUBLIC_WEB_APP_URL', 'https://strivon.app').replace(/\/$/, '') + '/pricing',
};
