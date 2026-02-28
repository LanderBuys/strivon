"use client";

import Link from "next/link";

/** Matches mobile: story circle 72px, border 2.5px, label 12px, marginTop 8px, container paddingVertical 14px, paddingHorizontal 16px. */
interface StoryCircleProps {
  id: string;
  label: string;
  avatarUrl?: string | null;
  isOwn?: boolean;
  hasNew?: boolean;
}

function StoryCircle({ label, avatarUrl, isOwn, hasNew }: StoryCircleProps) {
  return (
    <button
      type="button"
      className="smooth-btn group flex shrink-0 flex-col items-center"
      aria-label={label}
    >
      <span
        className={`relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-[2.5px] bg-[var(--card)] p-[2.5px] transition-transform group-hover:scale-[0.98] ${
          hasNew ? "border-[var(--accent)]" : "border-[var(--card-border)]"
        }`}
      >
        <span className="h-full w-full overflow-hidden rounded-full bg-[var(--background)]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-[var(--accent-muted)] text-xl font-bold text-[var(--accent)]">
              {label.slice(0, 1)}
            </span>
          )}
        </span>
        {isOwn && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-[2.5px] border-[var(--card)] bg-[var(--accent)] text-xs font-bold text-white">
            +
          </span>
        )}
      </span>
      <span className="mt-2 max-w-[92px] truncate text-center text-[12px] text-[var(--foreground)] group-hover:opacity-90">
        {label}
      </span>
    </button>
  );
}

const PLACEHOLDER_STORIES: StoryCircleProps[] = [
  { id: "you", label: "Your Story", isOwn: true },
  { id: "1", label: "Builders", hasNew: true },
  { id: "2", label: "Startups" },
  { id: "3", label: "Design" },
  { id: "4", label: "Dev" },
];

export function StoriesBar() {
  return (
    <div className="border-b border-[var(--divider)] bg-[var(--card)] py-[14px]">
      <div className="flex overflow-x-auto px-4 scrollbar-hide gap-2">
        {PLACEHOLDER_STORIES.map((s) => (
          <StoryCircle
            key={s.id}
            id={s.id}
            label={s.label}
            avatarUrl={s.id === "you" ? null : undefined}
            isOwn={s.isOwn}
            hasNew={s.hasNew}
          />
        ))}
      </div>
    </div>
  );
}
