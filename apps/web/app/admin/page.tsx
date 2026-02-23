"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  getDashboardExtended,
  getMockDashboardExtended,
  type ExtendedDashboardData,
} from "@/lib/admin";
import { formatReportDate } from "@/lib/format";
import { useAdminMock } from "./MockContext";

const REFRESH_INTERVAL_MS = 1000;

type PulseDir = "up" | "down";

function StatCard({
  label,
  value,
  href,
  accent = "default",
  sub,
  pulse,
}: {
  label: string;
  value: number;
  href?: string;
  accent?: "default" | "warning" | "success" | "muted";
  sub?: string;
  pulse?: PulseDir;
}) {
  const isAlert = accent === "warning";
  const valueClass = isAlert
    ? "admin-ticker-alert"
    : accent === "success"
      ? "text-violet-400"
      : accent === "muted"
        ? "text-slate-500"
        : "admin-ticker";
  const pulseClass = pulse === "up" ? " admin-stat-up" : pulse === "down" ? " admin-stat-down" : "";
  const content = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold admin-stat-value ${valueClass}${pulseClass}`}>{value.toLocaleString()}</p>
      {sub != null && <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p>}
    </>
  );
  const cardPulse = pulse === "up" ? " admin-card-pulse-up" : pulse === "down" ? " admin-card-pulse-down" : "";
  const cardClass = `admin-card p-4 ${isAlert ? "admin-card-alert" : ""}${cardPulse}`;
  if (href) {
    return (
      <Link href={href} className={`block ${cardClass}`}>
        {content}
      </Link>
    );
  }
  return <div className={cardClass}>{content}</div>;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function getStatSnapshot(d: ExtendedDashboardData): Record<string, number> {
  return {
    reportsPending: d.reportsPending,
    reportsTotal: d.reportsTotal,
    postReports: d.reportByType.post,
    userReports: d.reportByType.user,
    usersCount: d.usersCount,
    postsCount: d.postsCount,
    spacesCount: d.spacesCount,
    storiesCount: d.storiesCount,
    postLikesCount: d.postLikesCount,
    postSavesCount: d.postSavesCount,
    spaceMembersCount: d.spaceMembersCount,
    followsCount: d.followsCount,
    removedPostsCount: d.removedPostsCount,
  };
}

export default function AdminDashboardPage() {
  const { mockEnabled } = useAdminMock();
  const [data, setData] = useState<ExtendedDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);
  const [pulse, setPulse] = useState<Record<string, PulseDir>>({});
  const [clock, setClock] = useState("");
  const prevSnapshot = useRef<Record<string, number> | null>(null);
  const loadIdRef = useRef(0);

  const load = useCallback(() => {
    setError(null);
    if (mockEnabled) {
      setData(getMockDashboardExtended());
      setCountdown(REFRESH_INTERVAL_MS / 1000);
      return;
    }
    const runId = ++loadIdRef.current;
    setRefreshing(true);
    getDashboardExtended()
      .then((d) => {
        if (runId !== loadIdRef.current) return;
        const next = getStatSnapshot(d);
        const prev = prevSnapshot.current;
        const delta: Record<string, PulseDir> = {};
        if (prev) {
          (Object.keys(next) as Array<keyof typeof next>).forEach((k) => {
            const a = prev[k] ?? 0;
            const b = next[k] ?? 0;
            if (b > a) delta[k] = "up";
            else if (b < a) delta[k] = "down";
          });
          setPulse(delta);
        }
        prevSnapshot.current = next;
        setData(d);
        setCountdown(REFRESH_INTERVAL_MS / 1000);
        setTimeout(() => setPulse({}), 1200);
      })
      .catch((e) => {
        if (runId !== loadIdRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      })
      .finally(() => {
        if (runId !== loadIdRef.current) return;
        setRefreshing(false);
      });
  }, [mockEnabled]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const format = () => {
      const n = new Date();
      setClock(n.toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    format();
    const t = setInterval(format, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (mockEnabled || !data) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          load();
          return REFRESH_INTERVAL_MS / 1000;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mockEnabled, data, load]);

  if (error) {
    return (
      <div className="admin-card admin-card-alert p-5">
        <p className="font-medium text-red-400">Could not load dashboard</p>
        <p className="mt-1 text-sm text-slate-400">{error}</p>
        <button type="button" onClick={load} className="mt-3 admin-btn-danger px-3 py-1.5 text-xs font-medium">
          Retry
        </button>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  const tickerText = " STRIVON · LIVE · REPORTS · USERS · POSTS · SPACES · LIKES · FOLLOWS · REFRESH 1S · ";

  return (
    <div className="space-y-6">
      {/* Ticker strip */}
      {!mockEnabled && (
        <div className="admin-ticker-strip py-1.5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="admin-ticker-scroll text-[10px] font-medium uppercase tracking-widest text-violet-400/80">
                {tickerText.repeat(2)}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="admin-stat-value text-[11px] text-violet-400/90 tabular-nums">{clock}</span>
              <span className="admin-live-dot live-pulse" />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">
            Dashboard
            {mockEnabled && <span className="ml-2 text-xs font-normal text-amber-400">(mock)</span>}
          </h1>
          {!mockEnabled && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-violet-400">
              <span className="admin-live-dot live-pulse" />
              Live · {countdown}s
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => { load(); setCountdown(REFRESH_INTERVAL_MS / 1000); }}
          disabled={refreshing}
          className="admin-btn-ghost px-3 py-1.5 text-xs"
        >
          {refreshing ? "…" : "Refresh now"}
        </button>
      </div>

      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Reports</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatCard
            label="Pending"
            value={data.reportsPending}
            href="/admin/reports"
            accent={data.reportsPending > 0 ? "warning" : "default"}
            sub={data.reportsPending > 0 ? "Needs attention" : undefined}
            pulse={pulse.reportsPending}
          />
          <StatCard
            label="Total"
            value={data.reportsTotal}
            sub={`${data.reportsDismissed} dismissed · ${data.reportsRemoved} removed`}
            pulse={pulse.reportsTotal}
          />
          <StatCard label="Post" value={data.reportByType.post} accent="success" pulse={pulse.postReports} />
          <StatCard label="User" value={data.reportByType.user} accent="success" pulse={pulse.userReports} />
        </div>
        {data.reportReasons.length > 0 && (
          <div className="mt-3 admin-card p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">By reason</p>
            <div className="flex flex-wrap gap-2">
              {data.reportReasons.map(({ reason, count }) => (
                <span key={reason} className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                  {reason}: <span className="admin-stat-value text-violet-400">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Content & engagement</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Users" value={data.usersCount} accent="success" pulse={pulse.usersCount} />
          <StatCard label="Posts" value={data.postsCount} accent="success" pulse={pulse.postsCount} />
          <StatCard label="Spaces" value={data.spacesCount} accent="success" pulse={pulse.spacesCount} />
          <StatCard label="Stories" value={data.storiesCount} accent="success" pulse={pulse.storiesCount} />
          <StatCard label="Likes" value={data.postLikesCount} accent="success" pulse={pulse.postLikesCount} />
          <StatCard label="Saves" value={data.postSavesCount} accent="success" pulse={pulse.postSavesCount} />
        </div>
      </section>

      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Community</h2>
        <div className="grid gap-3 grid-cols-3">
          <StatCard label="Space members" value={data.spaceMembersCount} sub="Join events" accent="success" pulse={pulse.spaceMembersCount} />
          <StatCard label="Follows" value={data.followsCount} accent="success" pulse={pulse.followsCount} />
          <StatCard label="Removed" value={data.removedPostsCount} accent="muted" sub="Moderation" pulse={pulse.removedPostsCount} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Recent reports</h2>
            <Link href="/admin/reports" className="text-[10px] font-medium text-violet-400 hover:text-violet-300 transition-colors">View all</Link>
          </div>
          {data.recentReports.length === 0 ? (
            <p className="text-xs text-slate-500">No reports yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.recentReports.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-300">
                    <span className="font-medium text-slate-100">{r.type}</span> · {r.reason}
                    <span className="ml-1 text-slate-500">({r.status})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{formatReportDate(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card p-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Recent posts</h2>
          {data.recentPosts.length === 0 ? (
            <p className="text-xs text-slate-500">No posts yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentPosts.map((p) => (
                <li key={p.id} className="text-xs">
                  <p className="text-slate-200 line-clamp-2">{p.contentPreview || "(no text)"}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">@{p.authorHandle} · {formatReportDate(p.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card p-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Recent users</h2>
          {data.recentUsers.length === 0 ? (
            <p className="text-xs text-slate-500">No users yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.recentUsers.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-300"><span className="font-medium text-slate-100">@{u.handle}</span> · {u.name}</span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{formatDate(u.joinDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-card p-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Top spaces</h2>
          {data.topSpaces.length === 0 ? (
            <p className="text-xs text-slate-500">No spaces yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.topSpaces.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-200">{s.name}</span>
                  <span className="admin-stat-value text-violet-400">{s.memberCount}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Link href="/admin/reports" className="admin-btn-primary px-4 py-2 text-xs font-semibold">
          Manage reports
        </Link>
        <Link href="/admin/reports?status=pending" className="admin-btn-ghost px-4 py-2 text-xs font-medium">
          Pending only
        </Link>
      </div>
    </div>
  );
}
