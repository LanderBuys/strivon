import { Post } from '@/types/post';

/** Sorts posts so unseen (not in seenIds) appear first, then seen. */
export function sortPostsUnseenFirst(posts: Post[], seenIds: Set<string>): Post[] {
  const unseen: Post[] = [];
  const seen: Post[] = [];
  for (const p of posts) {
    if (seenIds.has(p.id)) seen.push(p);
    else unseen.push(p);
  }
  return [...unseen, ...seen];
}
