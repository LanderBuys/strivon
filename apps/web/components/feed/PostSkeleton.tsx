"use client";

/** Matches PostCard layout: mx-4 my-2, padding 24px horizontal, 22px vertical, radius 16px. */
export function PostSkeleton() {
  return (
    <div className="mx-4 my-2 overflow-hidden rounded-[16px] border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow)]">
      <div className="flex items-start gap-4 px-6 pt-[22px]">
        <div className="h-12 w-12 shrink-0 rounded-full shimmer" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <div className="h-4 w-28 rounded shimmer" />
          <div className="h-[15px] w-36 rounded shimmer" />
        </div>
      </div>
      <div className="px-6 pb-2">
        <div className="h-4 w-full rounded shimmer" />
        <div className="mt-2 h-4 w-3/4 rounded shimmer" />
      </div>
      <div className="mx-4 mt-2 h-40 rounded-xl shimmer" />
      <div className="flex gap-0 border-t border-[var(--divider)] px-6 pt-2 pb-[22px] min-h-[40px]">
        <div className="h-5 w-14 rounded-lg shimmer" />
        <div className="h-5 w-14 rounded-lg shimmer" />
      </div>
    </div>
  );
}
