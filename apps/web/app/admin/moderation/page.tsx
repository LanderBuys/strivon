"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getMediaNeedsReview,
  approveMedia,
  rejectMedia,
  banUser,
  type ModerationMediaItem,
} from "@/lib/admin";
import { formatReportDate } from "@/lib/format";

export default function AdminModerationPage() {
  const [items, setItems] = useState<ModerationMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    getMediaNeedsReview()
      .then((list) => {
        setItems(list);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (mediaId: string) => {
    setActing(mediaId);
    try {
      await approveMedia(mediaId);
      setItems((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (mediaId: string) => {
    setActing(mediaId);
    try {
      await rejectMedia(mediaId);
      setItems((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setActing(null);
    }
  };

  const handleBan = async (uid: string) => {
    if (!confirm("Ban this user? They will not be able to upload or post.")) return;
    setActing(`ban-${uid}`);
    try {
      await banUser(uid);
      setItems((prev) => prev.filter((m) => m.ownerUid !== uid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ban failed");
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
        <p className="text-sm text-slate-500">Loading moderation queue…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold text-white">Media moderation</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="admin-btn-ghost px-3 py-1.5 text-xs">
            Dashboard
          </Link>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="admin-btn-primary px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Items here need manual review. Approve moves file to public and publishes the post; Reject deletes the file and marks the post rejected. Quarantine files are not readable by clients (no preview).
      </p>

      {error && (
        <div className="admin-card admin-card-alert p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="admin-card p-6 text-center">
          <p className="text-slate-500">No items needing review.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((m) => (
            <li key={m.id} className="admin-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-slate-400">{m.id}</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {m.ownerName ?? "—"} (@{m.ownerHandle ?? m.ownerUid})
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.type} · {formatReportDate(m.createdAt)}
                    {m.provider != null && ` · ${m.provider}`}
                  </p>
                  {(m.goreScore != null || m.flags?.length) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.goreScore != null && (
                        <span className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                          gore: {(m.goreScore * 100).toFixed(0)}%
                        </span>
                      )}
                      {m.flags?.map((f) => (
                        <span
                          key={f}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-400"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(m.id)}
                    disabled={acting !== null}
                    className="admin-btn-primary px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  >
                    {acting === m.id ? "…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(m.id)}
                    disabled={acting !== null}
                    className="admin-btn-danger px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  >
                    {acting === m.id ? "…" : "Reject"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBan(m.ownerUid)}
                    disabled={acting !== null}
                    className="admin-btn-ghost px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  >
                    {acting === `ban-${m.ownerUid}` ? "…" : "Ban user"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
