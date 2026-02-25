"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/api/posts";

export default function CreatePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setError("");
    setLoading(true);
    try {
      await createPost({ content: text });
      setContent("");
      router.push("/app/feed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">Create post</h2>
      <form onSubmit={handleSubmit} className="app-card overflow-hidden p-6 md:p-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
            {error}
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? Share a build log, a question, or a win."
          rows={5}
          className="w-full resize-none rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3.5 text-[var(--foreground)] placeholder-[var(--muted)] transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          disabled={loading}
        />
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex gap-1 text-[var(--muted)]">
            <button type="button" className="smooth-btn rounded-xl p-2.5 hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]" title="Add image">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button type="button" className="smooth-btn rounded-xl p-2.5 hover:bg-[var(--accent-subtle)] hover:text-[var(--foreground)]" title="Add space">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="app-btn-primary smooth-btn rounded-xl px-6 py-2.5 font-semibold disabled:opacity-50"
          >
            {loading ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
