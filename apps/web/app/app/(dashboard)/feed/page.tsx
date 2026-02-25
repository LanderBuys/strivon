"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getFeedPosts, likePost, savePost } from "@/lib/api/posts";
import type { Post } from "@/types/post";

const PAGE_SIZE = 10;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60 * 1000) return "Just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}d`;
  return d.toLocaleDateString();
}

function PostCard({
  post,
  onLike,
  onSave,
}: {
  post: Post;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
}) {
  const [liked, setLiked] = useState(!!post.isLiked);
  const [saved, setSaved] = useState(!!post.isSaved);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [savesCount, setSavesCount] = useState(post.saves);
  const [busy, setBusy] = useState(false);

  const handleLike = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const newCount = await onLike(post.id);
      setLikesCount(newCount);
      setLiked(!liked);
    } catch {
      // Post may not exist in Firestore (e.g. mock data)
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const newCount = await onSave(post.id);
      setSavesCount(newCount);
      setSaved(!saved);
    } catch {
      // Post may not exist in Firestore (e.g. mock data)
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="app-card smooth-card overflow-hidden">
      <div className="flex items-center gap-3 p-4 md:p-5">
        <Link href={`/app/profile/${post.author.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:bg-[var(--accent-subtle)]/50 -m-2 p-2">
          {post.author.avatar ? (
            <img
              src={post.author.avatar}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[var(--card-border)]"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-lg font-semibold text-[var(--accent)]">
              {post.author.name[0]}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[var(--foreground)]">{post.author.name}</p>
            <p className="truncate text-sm text-[var(--muted)]">{post.author.handle}</p>
          </div>
        </Link>
        <span className="shrink-0 text-sm text-[var(--muted)]">{formatTime(post.createdAt)}</span>
      </div>
      {post.content && (
        <div className="px-4 pb-3 md:px-5">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]">{post.content}</p>
        </div>
      )}
      {post.media && post.media.length > 0 && (
        <div className="relative aspect-video w-full bg-[var(--card-border)]/30">
          <Image
            src={post.media[0].url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
            unoptimized
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1 border-t border-[var(--card-border)]/80 px-4 py-3 md:px-5">
        <button
          type="button"
          onClick={handleLike}
          disabled={busy}
          className={`smooth-btn flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-red-500/10 ${
            liked ? "text-red-500" : "text-[var(--muted)] hover:text-red-500"
          }`}
        >
          <svg className="h-5 w-5" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span>{likesCount}</span>
        </button>
        <button
          type="button"
          className="smooth-btn flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <span>{post.comments ?? 0}</span>
        </button>
        <button
          type="button"
          className="smooth-btn flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          Share
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className={`smooth-btn ml-auto flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--accent-subtle)] ${
            saved ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <svg className="h-5 w-5" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          Save{savesCount > 0 ? ` ${savesCount}` : ""}
        </button>
      </div>
    </article>
  );
}

export default function FeedPage() {
  const [tab, setTab] = useState<"for-you" | "following">("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await getFeedPosts(tab, pageNum, PAGE_SIZE);
        if (append) setPosts((prev) => [...prev, ...result.data]);
        else setPosts(result.data);
        setHasMore(result.hasMore);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load feed");
        if (!append) setPosts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    setPage(1);
    loadPage(1, false);
  }, [tab, loadPage]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    loadPage(next, true);
  };

  const handleLike = useCallback(async (postId: string) => {
    const { likePost: apiLike } = await import("@/lib/api/posts");
    return apiLike(postId);
  }, []);

  const handleSave = useCallback(async (postId: string) => {
    const { savePost: apiSave } = await import("@/lib/api/posts");
    return apiSave(postId);
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex gap-1 rounded-2xl bg-[var(--card)] p-1.5 shadow-[var(--shadow)] ring-1 ring-[var(--card-border)]">
        <button
          type="button"
          onClick={() => setTab("for-you")}
          className={`smooth-btn flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
            tab === "for-you"
              ? "bg-[var(--accent)] text-white shadow-sm dark:text-[var(--foreground)]"
              : "text-[var(--muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]"
          }`}
        >
          For You
        </button>
        <button
          type="button"
          onClick={() => setTab("following")}
          className={`smooth-btn flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
            tab === "following"
              ? "bg-[var(--accent)] text-white shadow-sm dark:text-[var(--foreground)]"
              : "text-[var(--muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]"
          }`}
        >
          Following
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-[var(--card)] ring-1 ring-[var(--card-border)]" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLike={handleLike} onSave={handleSave} />
            ))}
          </div>
          {hasMore && posts.length > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="smooth-btn rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-6 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent)]/30 disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
          {!loading && posts.length === 0 && (
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center text-[var(--muted)] shadow-[var(--shadow)]">
              {tab === "following" ? "Follow people to see their posts here." : "No posts yet. Be the first to post!"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
