"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ThreadContent from "./ThreadContent";

function ThreadInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  return <ThreadContent postId={id} />;
}

export default function ThreadPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--card)] ring-1 ring-[var(--card-border)]" />
        </div>
      }
    >
      <ThreadInner />
    </Suspense>
  );
}
