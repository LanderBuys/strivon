"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getFirestoreUser } from "@/lib/firestore/users";
import { followUser, unfollowUser, isFollowing } from "@/lib/api/users";
import type { FirestoreUser } from "@/lib/firestore/users";

export default function ProfileByIdPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getFirestoreUser(id)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user?.uid || !id || user.uid === id) return;
    isFollowing(user.uid, id).then(setFollowing).catch(() => {});
  }, [user?.uid, id]);

  const handleFollow = useCallback(async () => {
    if (!user?.uid || !id || busy) return;
    setBusy(true);
    try {
      if (following) {
        await unfollowUser(user.uid, id);
        setFollowing(false);
      } else {
        await followUser(user.uid, id);
        setFollowing(true);
      }
    } finally {
      setBusy(false);
    }
  }, [user?.uid, id, following, busy]);

  const isOwnProfile = user?.uid === id;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--card)] ring-1 ring-[var(--card-border)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-[var(--muted)]">User not found.</p>
        <Link href="/app/feed" className="mt-4 inline-block font-medium text-[var(--accent)] hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="app-card overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-[var(--accent)]/40 to-teal-600/40" />
        <div className="relative px-6 pb-6 md:px-8 md:pb-8">
          <div className="-mt-12 flex flex-col items-start gap-4">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt=""
                className="h-24 w-24 rounded-full border-4 border-[var(--card)] object-cover shadow-[var(--shadow)]"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[var(--card)] bg-[var(--accent-muted)] text-3xl font-semibold text-[var(--accent)] shadow-[var(--shadow)]">
                {profile.name[0]}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[var(--foreground)]">{profile.name}</h1>
              <p className="text-[var(--muted)]">{profile.handle}</p>
              {profile.bio && <p className="mt-2 text-[var(--muted-foreground)]">{profile.bio}</p>}
            </div>
            {isOwnProfile ? (
              <Link
                href="/app/profile"
                className="smooth-btn rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent-subtle)]"
              >
                Edit profile
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleFollow}
                disabled={busy}
                className={`smooth-btn rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
                  following
                    ? "border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent-subtle)]"
                    : "app-btn-primary"
                }`}
              >
                {busy ? "…" : following ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
