"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/types/post";

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60 * 1000) return "Just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}d`;
  return d.toLocaleDateString();
}

function CopyLinkButton({ postId }: { postId: string }) {
  const [copied, setCopied] = useState(false);
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}/app/thread?id=${encodeURIComponent(postId)}` : "";
    try {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(url, "_blank");
    }
  };
  return (
    <button
      type="button"
      onClick={handleShare}
      className="smooth-btn flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-normal text-[var(--muted)] transition-colors hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)] min-w-[40px]"
    >
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  index?: number;
}

export function PostCard({ post, onLike, onSave, index = 0 }: PostCardProps) {
  const [liked, setLiked] = useState(!!post.isLiked);
  const [saved, setSaved] = useState(!!post.isSaved);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [savesCount, setSavesCount] = useState(post.saves);
  const [busy, setBusy] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await onLike(post.id);
      setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
      setLiked(!liked);
    } catch {
      // Post may not exist in Firestore (e.g. mock data)
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await onSave(post.id);
      setSavesCount((prev) => (saved ? prev - 1 : prev + 1));
      setSaved(!saved);
    } catch {
      // Post may not exist in Firestore (e.g. mock data)
    } finally {
      setBusy(false);
    }
  };

  const threadUrl = `/app/thread?id=${encodeURIComponent(post.id)}`;

  /* Mobile: marginVertical sm (8), marginHorizontal md (16), paddingHorizontal lg (24), paddingTop/Bottom md+6 (22), avatar 48px, borderRadius lg (16) */
  return (
    <article
      className="app-card smooth-card mx-4 my-2 overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 60, 320)}ms`, animationFillMode: "backwards" }}
    >
      <Link href={threadUrl} className="block">
        <div className="flex items-start gap-4 px-6 pt-[22px]">
          <Link
            href={`/app/profile/${post.author.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex min-w-0 flex-1 items-start gap-4 rounded-lg -m-1.5 p-1.5 transition-colors hover:bg-[var(--accent-subtle)]"
          >
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-lg font-bold text-[var(--accent)]">
                {post.author.name[0]}
              </span>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="truncate text-base font-bold leading-4 tracking-tight text-[var(--foreground)]">{post.author.name}</p>
              <p className="truncate text-[15px] text-[var(--muted)] opacity-70">@{post.author.handle} · {formatTime(post.createdAt)}</p>
            </div>
          </Link>
        </div>
        {post.content && (
          <div className="px-6 pb-2">
            <p className="whitespace-pre-wrap text-[15px] leading-[1.5] text-[var(--foreground)]">{post.content}</p>
          </div>
        )}
        {post.media && post.media.length > 0 && (
          <div className="relative mx-4 mt-2 aspect-video w-[calc(100%-2rem)] overflow-hidden rounded-xl bg-[var(--card-border)]">
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
      </Link>

      <div
        className="flex flex-wrap items-center border-t border-[var(--divider)] px-6 pt-2 pb-[22px] min-h-[40px]"
        onClick={(e) => e.preventDefault()}
      >
        <button
          type="button"
          onClick={handleLike}
          disabled={busy}
          className={`smooth-btn flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-normal transition-colors hover:bg-red-500/10 min-w-[40px] ${
            liked ? "text-red-500" : "text-[var(--muted)] hover:text-red-500"
          }`}
        >
          <svg className="h-5 w-5 shrink-0" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {likesCount}
        </button>
        <Link
          href={threadUrl}
          className="smooth-btn flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-normal text-[var(--muted)] transition-colors hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] min-w-[40px]"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          {post.comments ?? 0}
        </Link>
        <CopyLinkButton postId={post.id} />
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className={`smooth-btn ml-auto flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-normal transition-colors hover:bg-[var(--accent-subtle)] min-w-[40px] ${
            saved ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <svg className="h-5 w-5 shrink-0" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          Save{savesCount > 0 ? ` ${savesCount}` : ""}
        </button>
      </div>
    </article>
  );
}
