"use client";

export type FeedTabType = "for-you" | "following";

interface FeedTabsProps {
  activeTab: FeedTabType;
  onTabChange: (tab: FeedTabType) => void;
  filterButton?: React.ReactNode;
}

/** Matches mobile FeedTabs: paddingVertical 8px, paddingHorizontal 16px, tab minHeight 48, strip height 4px, strip left/right 16px. */
export function FeedTabs({ activeTab, onTabChange, filterButton }: FeedTabsProps) {
  return (
    <div
      className="flex items-center border-b border-[var(--divider)] bg-[var(--card)] py-2 px-4"
      role="tablist"
    >
      <div className="flex flex-1 items-center">
        <div className="flex min-h-[48px] flex-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "for-you"}
            aria-label="For You"
            onClick={() => onTabChange("for-you")}
            className={`smooth-btn relative flex flex-1 items-center justify-center px-4 py-3 text-[15px] transition-colors hover:bg-[var(--accent-subtle)] ${
              activeTab === "for-you" ? "font-bold text-[var(--foreground)]" : "font-medium text-[var(--muted)]"
            }`}
          >
            For You
            <span
              className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-[var(--accent)] transition-opacity"
              style={{ opacity: activeTab === "for-you" ? 1 : 0 }}
              aria-hidden
            />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "following"}
            aria-label="Following"
            onClick={() => onTabChange("following")}
            className={`smooth-btn relative flex flex-1 items-center justify-center px-4 py-3 text-[15px] transition-colors hover:bg-[var(--accent-subtle)] ${
              activeTab === "following" ? "font-bold text-[var(--foreground)]" : "font-medium text-[var(--muted)]"
            }`}
          >
            Following
            <span
              className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-[var(--accent)] transition-opacity"
              style={{ opacity: activeTab === "following" ? 1 : 0 }}
              aria-hidden
            />
          </button>
        </div>
        {filterButton && <div className="ml-2 pl-2">{filterButton}</div>}
      </div>
    </div>
  );
}
