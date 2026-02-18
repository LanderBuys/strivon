/**
 * In-memory store for media picked for a story before opening the editor.
 * Used so we don't pass long file URIs through route params (which can break or truncate).
 */

let pending: { uri: string; type: string } | null = null;

export function setPendingStoryMedia(uri: string, type: string): void {
  pending = { uri, type: type === 'video' ? 'video' : 'image' };
}

export function getPendingStoryMedia(): { uri: string; type: string } | null {
  const out = pending;
  pending = null;
  return out;
}

export function hasPendingStoryMedia(): boolean {
  return pending != null;
}
