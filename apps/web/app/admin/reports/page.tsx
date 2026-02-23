"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  getReports,
  getMockReports,
  dismissReport,
  removeReportedContent,
  type ReportItem,
} from "@/lib/admin";
import { formatReportDate } from "@/lib/format";
import { useAdminMock } from "../MockContext";

type Tab = "pending" | "dismissed" | "removed" | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "dismissed", label: "Dismissed" },
  { key: "removed", label: "Removed" },
  { key: "all", label: "All" },
];

function StatusBadge({ status }: { status: ReportItem["status"] }) {
  const styles = {
    pending: "border-amber-500/50 bg-amber-500/20 text-amber-400",
    dismissed: "border-zinc-600 bg-zinc-800/50 text-zinc-400",
    removed: "border-red-500/50 bg-red-500/20 text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${styles[status]}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: "user" | "post" }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-300">
      {type === "post" ? "Post" : "User"}
    </span>
  );
}

export default function AdminReportsPage() {
  const { mockEnabled } = useAdminMock();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("pending");
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const loadIdRef = useRef(0);

  useEffect(() => {
    const status = searchParams.get("status") as Tab | null;
    if (status && (status === "pending" || status === "dismissed" || status === "removed" || status === "all")) {
      setTab(status);
    }
  }, [searchParams]);

  const load = () => {
    setError(null);
    if (mockEnabled) {
      setReports(getMockReports(tab));
      setLoading(false);
      return;
    }
    const runId = ++loadIdRef.current;
    setLoading(true);
    getReports(tab)
      .then((data) => {
        if (runId !== loadIdRef.current) return;
        setReports(data);
      })
      .catch((e) => {
        if (runId !== loadIdRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to load reports");
      })
      .finally(() => {
        if (runId !== loadIdRef.current) return;
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [tab, mockEnabled]);

  const handleDismiss = async (id: string) => {
    setActing(id);
    if (mockEnabled) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: "dismissed" as const } : r)));
      setActing(null);
      return;
    }
    try {
      await dismissReport(id);
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: "dismissed" as const } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to dismiss");
    } finally {
      setActing(null);
    }
  };

  const handleRemove = async (id: string) => {
    setConfirmRemove(null);
    setActing(id);
    if (mockEnabled) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: "removed" as const } : r)));
      setActing(null);
      return;
    }
    try {
      await removeReportedContent(id);
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: "removed" as const } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove content");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-white">
        Reports
        {mockEnabled && <span className="ml-2 text-xs font-normal text-amber-400">(mock)</span>}
      </h1>

      <div className="flex flex-wrap gap-0 border-b border-white/10">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              tab === key
                ? "border-violet-400 text-violet-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="admin-card admin-card-alert px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
          <p className="text-xs text-slate-500">Loading…</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <p className="text-slate-400">No reports in this tab.</p>
          <p className="mt-1 text-[10px] text-slate-500">Reports from the app will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="admin-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={r.type} />
                    <StatusBadge status={r.status} />
                    <span className="text-[10px] text-zinc-500 tabular-nums">{formatReportDate(r.createdAt)}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200">Reason: {r.reason}</p>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1">Reported content</p>
                    {r.type === "post" ? (
                      <>
                        {(r.targetUserHandle || r.targetUserName) && (
                          <p className="text-[10px] text-slate-400 mb-1.5">
                            By {r.targetUserName || ""} {r.targetUserHandle ? `@${r.targetUserHandle}` : ""}
                          </p>
                        )}
                        {r.targetPostPreview ? (
                          <p className="text-xs text-slate-200 whitespace-pre-wrap break-words">
                            {r.targetPostPreview}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No preview. Post ID: {r.targetPostId || "—"}</p>
                        )}
                        {r.targetPostId && (
                          <p className="mt-1.5 text-[10px] text-slate-500">ID: {r.targetPostId}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-200">
                        User {r.targetUserName || ""} {r.targetUserHandle ? `(@${r.targetUserHandle})` : ""}
                        {!r.targetUserName && !r.targetUserHandle && `ID: ${r.targetUserId}`}
                      </p>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500">Reporter: {r.reporterHandle ? `@${r.reporterHandle}` : r.reporterId}</p>
                </div>
                {r.status === "pending" && (
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      onClick={() => handleDismiss(r.id)}
                      disabled={acting !== null}
                      className="admin-btn-ghost px-3 py-1.5 text-xs disabled:opacity-50"
                    >
                      {acting === r.id ? "…" : "Dismiss"}
                    </button>
                    {confirmRemove === r.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Remove?</span>
                        <button
                          onClick={() => handleRemove(r.id)}
                          disabled={acting !== null}
                          className="admin-btn-danger px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="admin-btn-ghost px-3 py-1.5 text-xs"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(r.id)}
                        disabled={acting !== null}
                        className="admin-btn-primary px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                      >
                        Remove content
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
