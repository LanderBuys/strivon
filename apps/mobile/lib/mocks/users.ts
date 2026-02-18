/** Minimal mock list for components that need a fallback user list. */
export const mockUsers = [
  { id: '1', name: 'User', handle: '@user', avatar: null as string | null },
];

/** Current signed-in user id, or '1' when not signed in. Use this instead of a constant. */
export function getCurrentUserIdOrFallback(): string {
  const { getCurrentUserId } = require('@/lib/firebase');
  return getCurrentUserId() ?? '1';
}

/** @deprecated Use getCurrentUserIdOrFallback() so the real signed-in user is used. */
export const CURRENT_USER_ID = '1';

export const mockUserSpaces: string[] = [];
