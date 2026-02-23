"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FAKE_ACCOUNTS,
  createPostAsFakeUser,
  getRecentFakePosts,
  type FakeAccountId,
  type FakeAccountPost,
  type FakePostMediaInput,
} from "@/lib/admin";
import { useAdminMock } from "../MockContext";

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

const MOCK_FAKE_POSTS: FakeAccountPost[] = [
  {
    id: "mock-p1",
    authorId: "fake-1",
    authorHandle: "alex_demo",
    authorName: "Alex Demo",
    content: "This is a sample post from a fake account for testing.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-p2",
    authorId: "fake-2",
    authorHandle: "sam_tester",
    authorName: "Sam Tester",
    content: "Post with media.",
    media: [
      { id: "m1", type: "image", url: "https://placekitten.com/400/300" },
    ],
    createdAt: new Date().toISOString(),
  },
];

export default function AdminFakeAccountsPage() {
  const { mockEnabled } = useAdminMock();
  const [posts, setPosts] = useState<FakeAccountPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<FakeAccountId>("fake-1");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [mediaItems, setMediaItems] = useState<FakePostMediaInput[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<"image" | "video">("image");
  const [newMediaThumbnail, setNewMediaThumbnail] = useState("");

  const load = useCallback(() => {
    if (mockEnabled) {
      setPosts(MOCK_FAKE_POSTS);
      setLoading(false);
      return;
    }
    setLoading(true);
    getRecentFakePosts(30)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [mockEnabled]);

  useEffect(() => {
    load();
  }, [load]);

  const canPost = content.trim().length > 0 || mediaItems.length > 0;

  const addMedia = () => {
    const url = newMediaUrl.trim();
    if (!url) return;
    setMediaItems((prev) => [...prev, { type: newMediaType, url, thumbnail: newMediaThumbnail.trim() || undefined }]);
    setNewMediaUrl("");
    setNewMediaThumbnail("");
  };

  const removeMedia = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!canPost) {
      setError("Enter some content and/or add at least one media URL.");
      return;
    }
    if (mockEnabled) {
      setError("Posting is disabled in mock mode.");
      return;
    }
    setError(null);
    setPosting(true);
    try {
      await createPostAsFakeUser(selectedAccount, {
        content: content.trim(),
        title: title.trim() || undefined,
        media: mediaItems.length > 0 ? mediaItems : undefined,
      });
      setContent("");
      setTitle("");
      setMediaItems([]);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-white">Fake accounts</h1>
        <p className="mt-1 text-xs text-slate-500">
          Post content as one of 10 fake accounts. Use for demos, testing, or seeding the feed.
        </p>
      </div>

      <section className="admin-card p-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Post as</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {FAKE_ACCOUNTS.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => setSelectedAccount(acc.id)}
              className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                selectedAccount === acc.id
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                  : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200 bg-white/5"
              }`}
            >
              <span className="font-medium block truncate">@{acc.handle}</span>
              <span className="text-[10px] text-slate-500 truncate block">{acc.name}</span>
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What should this account post? (optional if you add media)"
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-y min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1">
              Media (image or video URLs)
            </label>
            <p className="text-[10px] text-slate-500 mb-2">
              Add publicly accessible image or video URLs (e.g. placekitten.com, imgur, or your CDN). Posts can be text-only, media-only, or both.
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              <select
                value={newMediaType}
                onChange={(e) => setNewMediaType(e.target.value as "image" | "video")}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-200 focus:border-violet-500/50 focus:outline-none"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              <input
                type="url"
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 min-w-[180px] rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={addMedia}
                disabled={!newMediaUrl.trim()}
                className="admin-btn-ghost px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {newMediaType === "video" && (
              <input
                type="url"
                value={newMediaThumbnail}
                onChange={(e) => setNewMediaThumbnail(e.target.value)}
                placeholder="Thumbnail URL (optional)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-violet-500/50 focus:outline-none mb-2"
              />
            )}
            {mediaItems.length > 0 && (
              <ul className="space-y-1.5 mt-2">
                {mediaItems.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5">
                    <span className="text-[10px] font-medium text-slate-400 capitalize">{m.type}</span>
                    <span className="flex-1 truncate text-xs text-slate-300" title={m.url}>{m.url}</span>
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            type="button"
            onClick={handlePost}
            disabled={posting || !canPost}
            className="admin-btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {posting ? "Posting…" : `Post as @${FAKE_ACCOUNTS.find((a) => a.id === selectedAccount)?.handle ?? selectedAccount}`}
          </button>
        </div>
      </section>

      <section className="admin-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Recent posts from fake accounts</h2>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="text-[10px] font-medium text-violet-400 hover:text-violet-300 disabled:opacity-50 transition-colors"
          >
            {loading ? "…" : "Refresh"}
          </button>
        </div>
        {loading && posts.length === 0 ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-xs text-slate-500">No posts from fake accounts yet.</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => (
              <li key={p.id} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                <p className="text-xs text-slate-200 whitespace-pre-wrap break-words">{p.content || "(no text)"}</p>
                {p.title && (
                  <p className="mt-0.5 text-xs font-medium text-slate-300">{p.title}</p>
                )}
                {p.media && p.media.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.media.slice(0, 5).map((m) => (
                      <a
                        key={m.id}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:text-violet-400 hover:border-white/20 transition-colors"
                      >
                        {m.type === "image" ? (
                          <img src={m.url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        ) : (
                          <span className="text-[10px]">▶ video</span>
                        )}
                        <span className="truncate max-w-[120px]">{m.url.replace(/^https?:\/\//, "").slice(0, 20)}…</span>
                      </a>
                    ))}
                    {p.media.length > 5 && (
                      <span className="text-[10px] text-slate-500">+{p.media.length - 5} more</span>
                    )}
                  </div>
                )}
                <p className="mt-1 text-[10px] text-slate-500">
                  @{p.authorHandle} · {formatDate(p.createdAt)}
                  {p.media && p.media.length > 0 && ` · ${p.media.length} ${p.media.length === 1 ? "media" : "media"}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
