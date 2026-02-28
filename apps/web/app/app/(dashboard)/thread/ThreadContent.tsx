"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getPostById, likePost, savePost } from "@/lib/api/posts";
import { getThreadMessages, sendThreadMessage } from "@/lib/api/threads";
import type { Post, ThreadMessage } from "@/types/post";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60 * 1000) return "Just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString();
}

function CommentItem({ message }: { message: ThreadMessage }) {
  const isReply = !!message.replyTo;
  return (
    <div className={`flex gap-3 ${isReply ? "ml-10" : ""}`}>
      {message.author.avatar ? (
        <img
          src={message.author.avatar}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[var(--card-border)]"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-sm font-semibold text-[var(--accent)]">
          {message.author.name[0]}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <Link
            href={`/app/profile/${message.author.id}`}
            className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)]"
          >
            {message.author.name}
          </Link>
          <span className="text-sm text-[var(--muted)]">{formatTime(message.createdAt)}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]">
          {message.content}
        </p>
      </div>
    </div>
  );
}

export default function ThreadContent({ postId }: { postId: string }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!postId) return;
    setError(null);
    setLoading(true);
    try {
      const [fetchedPost, fetchedMessages] = await Promise.all([
        getPostById(postId),
        getThreadMessages(postId),
      ]);
      setPost(fetchedPost ?? null);
      setMessages(fetchedMessages);
      if (fetchedPost) {
        setLiked(!!fetchedPost.isLiked);
        setSaved(!!fetchedPost.isSaved);
        setLikesCount(fetchedPost.likes);
        setSavesCount(fetchedPost.saves);
      }
    } catch {
      setError("Failed to load thread");
      setPost(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLike = async () => {
    if (!post || busy) return;
    setBusy(true);
    try {
      await likePost(post.id);
      setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
      setLiked(!liked);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!post || busy) return;
    setBusy(true);
    try {
      await savePost(post.id);
      setSavesCount((prev) => (saved ? prev - 1 : prev + 1));
      setSaved(!saved);
    } finally {
      setBusy(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = reply.trim();
    if (!text || !postId || sending) return;
    setSending(true);
    try {
      const newMsg = await sendThreadMessage(postId, text);
      setMessages((prev) => [...prev, newMsg]);
      setReply("");
    } catch {
      setError("Failed to send comment");
    } finally {
      setSending(false);
    }
  };

  if (!postId) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
        <p>Select a post from the feed to view the thread.</p>
        <Link href="/app/feed" className="mt-4 inline-block text-sm font-medium text-[var(--accent)] underline">
          Back to feed
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-64 animate-pulse rounded-2xl bg-[var(--card)] ring-1 ring-[var(--card-border)]" />
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--card)] ring-1 ring-[var(--card-border)]" />
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
        <p className="font-medium">{error}</p>
        <Link href="/app/feed" className="mt-4 inline-block text-sm font-medium text-[var(--accent)] underline">
          Back to feed
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
        Post not found.
        <Link href="/app/feed" className="mt-4 block text-sm font-medium text-[var(--accent)]">
          Back to feed
        </Link>
      </div>
    );
  }

  const topLevel = messages.filter((m) => !m.replyTo);
  const repliesMap = new Map<string, ThreadMessage[]>();
  messages.filter((m) => m.replyTo).forEach((m) => {
    if (!repliesMap.has(m.replyTo!)) repliesMap.set(m.replyTo!, []);
    repliesMap.get(m.replyTo!)!.push(m);
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="smooth-btn flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.19 4.25l-6.06 6.06 6.06 6.06M4.25 12h15.5" />
          </svg>
          Back to feed
        </button>
      </div>

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
          <span className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--muted)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
            {messages.length} {messages.length === 1 ? "comment" : "comments"}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className={`smooth-btn ml-auto flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[var(--accent-subtle)] ${
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

      <div className="mt-6">
        <h3 className="mb-4 text-base font-semibold text-[var(--foreground)]">Conversation</h3>
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
            <p>No comments yet. Be the first to reply.</p>
          </div>
        ) : (
          <div className="space-y-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] sm:p-6">
            {topLevel.map((comment) => (
              <div key={comment.id}>
                <CommentItem message={comment} />
                {(repliesMap.get(comment.id) || []).map((replyMsg) => (
                  <div key={replyMsg.id} className="mt-4">
                    <CommentItem message={replyMsg} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendReply} className="mt-6">
          <div className="flex gap-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="min-h-[80px] w-full resize-none rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="app-btn-primary smooth-btn self-end rounded-xl px-5 py-2.5 font-semibold disabled:opacity-50"
            >
              {sending ? "Sending…" : "Reply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
