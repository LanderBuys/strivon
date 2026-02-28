"use client";

import Link from "next/link";

export interface FeedScreenHeaderProps {
  unreadNotifications?: number;
  onSearchPress?: () => void;
  onRefreshPress?: () => void;
}

/** Matches mobile FeedScreenHeader: Strivon + subtitle left, icons right. Spacing: px-6 = 24px, py-4 = 16px, gap 16, icon 38x38, radius 20. */
const iconClass = "h-[22px] w-[22px] shrink-0";

export function FeedScreenHeader({ unreadNotifications = 0, onSearchPress, onRefreshPress }: FeedScreenHeaderProps) {
  return (
    <header
      className="flex items-center justify-between border-b border-[var(--divider)] bg-[var(--card)] px-6 py-4 shadow-[0_1px_3px_var(--shadow-color)]"
      role="banner"
    >
      <div>
        <h1 className="text-[24px] font-extrabold leading-none tracking-tight text-[var(--foreground)]" style={{ letterSpacing: "-0.4px" }}>
          Strivon
        </h1>
        <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)] opacity-90">Your builder network</p>
      </div>
      <div className="flex items-center gap-4">
        {onSearchPress ? (
          <button
            type="button"
            onClick={onSearchPress}
            className="smooth-btn flex h-[38px] min-h-[38px] w-[38px] min-w-[38px] items-center justify-center rounded-[20px] text-[var(--foreground)] transition-colors hover:bg-[var(--accent-subtle)]"
            aria-label="Search"
          >
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        ) : (
          <Link
            href="/app/feed"
            className="smooth-btn flex h-[38px] min-h-[38px] w-[38px] min-w-[38px] items-center justify-center rounded-[20px] text-[var(--foreground)] transition-colors hover:bg-[var(--accent-subtle)]"
            aria-label="Search"
          >
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </Link>
        )}
        {onRefreshPress && (
          <button
            type="button"
            onClick={onRefreshPress}
            className="smooth-btn flex h-[38px] min-h-[38px] w-[38px] min-w-[38px] items-center justify-center rounded-[20px] text-[var(--foreground)] transition-colors hover:bg-[var(--accent-subtle)]"
            aria-label="Refresh feed"
          >
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        )}
        <Link
          href="/app/create"
          className="smooth-btn flex h-[38px] min-h-[38px] w-[38px] min-w-[38px] items-center justify-center rounded-[20px] text-[var(--foreground)] transition-colors hover:bg-[var(--accent-subtle)]"
          aria-label="Create post"
        >
          <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </Link>
        <Link
          href="/app/feed"
          className="smooth-btn relative flex h-[38px] min-h-[38px] w-[38px] min-w-[38px] items-center justify-center rounded-[20px] text-[var(--foreground)] transition-colors hover:bg-[var(--accent-subtle)]"
          aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : "Notifications"}
        >
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75v-.7v.001a2.25 2.25 0 0 0-.5-.5 2.25 2.25 0 0 0-.5.5v.7c0 1.12.394 2.2 1.07 3.07 1.055.94 2.464 1.62 4.036 1.79 1.13.14 2.27.14 3.4 0 .24-.03.47-.06.7-.09.18-.02.36-.04.54-.06.22-.04.44-.08.66-.12.18-.03.36-.07.54-.12.06-.02.12-.03.18-.05a.75.75 0 0 0 .39-.99 23.87 23.87 0 0 1-1.31-5.454 8.967 8.967 0 0 1-6.07-3.07 8.967 8.967 0 0 1-3.07-6.07 8.967 8.967 0 0 1 3.07-6.07 8.967 8.967 0 0 1 6.07-3.07 8.967 8.967 0 0 1 6.07 3.07 8.967 8.967 0 0 1 3.07 6.07v.7a2.25 2.25 0 0 1-.5.5 2.25 2.25 0 0 1-.5-.5v-.7a8.967 8.967 0 0 0-3.07-6.07 8.967 8.967 0 0 0-6.07-3.07 8.967 8.967 0 0 0-6.07 3.07 8.967 8.967 0 0 0-3.07 6.07 8.967 8.967 0 0 0 3.07 6.07 8.967 8.967 0 0 0 6.07 3.07 23.848 23.848 0 0 1 5.454 1.31 8.967 8.967 0 0 1 1.79 4.036 23.848 23.848 0 0 1-1.31 5.454 8.967 8.967 0 0 1-1.79-4.036 8.967 8.967 0 0 1 1.79-4.036 23.848 23.848 0 0 1 1.31-5.454 8.967 8.967 0 0 1 4.036-1.79 23.848 23.848 0 0 1 5.454 1.31 8.967 8.967 0 0 1 4.036 1.79 8.967 8.967 0 0 1 1.79 4.036 23.848 23.848 0 0 1-1.31 5.454 8.967 8.967 0 0 1-1.79 4.036 23.848 23.848 0 0 1-5.454 1.31 8.967 8.967 0 0 1-4.036-1.79 8.967 8.967 0 0 1-1.79-4.036 23.848 23.848 0 0 1 1.31-5.454 8.967 8.967 0 0 1 1.79-4.036 8.967 8.967 0 0 1 4.036-1.79 23.848 23.848 0 0 1 5.454-1.31z" />
          </svg>
          {unreadNotifications > 0 && (
            <span className="absolute -right-1 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--card)] bg-[#DC2626] px-1 text-[10px] font-bold text-white">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
