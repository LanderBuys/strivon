"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { formatReportDate } from "@/lib/format";
import { useAdminMock } from "../MockContext";

export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string | null;
  country?: string | null;
  createdAt: string;
}

async function fetchWaitlist(): Promise<WaitlistEntry[]> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) throw new Error("Not signed in");
  const token = await auth.currentUser.getIdToken();
  const res = await fetch("/api/admin/waitlist", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body.error as string) || `Failed to load waitlist (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data.entries) ? data.entries : [];
}

export default function AdminWaitlistPage() {
  const { mockEnabled } = useAdminMock();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadIdRef = useRef(0);

  const load = useCallback(() => {
    setError(null);
    if (mockEnabled) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const runId = ++loadIdRef.current;
    setLoading(true);
    fetchWaitlist()
      .then((data) => {
        if (runId !== loadIdRef.current) return;
        setEntries(data);
      })
      .catch((e) => {
        if (runId !== loadIdRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to load waitlist");
      })
      .finally(() => {
        if (runId !== loadIdRef.current) return;
        setLoading(false);
      });
  }, [mockEnabled]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="admin-card admin-card-alert p-5">
        <p className="font-medium text-red-400">Could not load waitlist</p>
        <p className="mt-1 text-sm text-slate-400">{error}</p>
        <button type="button" onClick={load} className="mt-3 admin-btn-danger px-3 py-1.5 text-xs font-medium">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-bold text-white">
          Waitlist
          {mockEnabled && <span className="ml-2 text-xs font-normal text-amber-400">(mock – no data)</span>}
        </h1>
        {!mockEnabled && (
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="admin-btn-ghost px-3 py-1.5 text-xs"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        )}
      </div>

      <div className="admin-card p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
            <span className="text-sm text-slate-400">Loading waitlist…</span>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-500 py-8">No one has joined the waitlist yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 pb-2 pr-4">#</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 pb-2 pr-4">Email</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 pb-2 pr-4">Country</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 pb-2 pr-4">Joined</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2.5 pr-4 text-xs text-slate-500 tabular-nums">{i + 1}</td>
                    <td className="py-2.5 pr-4 text-sm text-slate-200 font-medium">{entry.email}</td>
                    <td className="py-2.5 pr-4 text-sm text-slate-400">{entry.country ?? entry.name ?? "—"}</td>
                    <td className="py-2.5 text-xs text-slate-500">{formatReportDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
