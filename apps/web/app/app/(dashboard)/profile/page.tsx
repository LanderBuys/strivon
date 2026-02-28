"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getFirestoreUser } from "@/lib/firestore/users";
import type { FirestoreUser } from "@/lib/firestore/users";

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, isFirebaseEnabled } = useAuth();
  const [profile, setProfile] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    getFirestoreUser(user.uid)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/app/sign-in");
  };

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-[var(--muted)]">Please sign in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="h-52 animate-pulse rounded-2xl bg-[var(--card)] ring-1 ring-[var(--card-border)]" />
      </div>
    );
  }

  const displayName = profile?.name ?? user.displayName ?? user.email?.split("@")[0] ?? "User";
  const handle = profile?.handle ?? `@user${user.uid.slice(0, 8)}`;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="app-card overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-[var(--accent)] to-teal-600" />
        <div className="relative px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            {user.photoURL || profile?.avatar ? (
              <img
                src={(user.photoURL || profile?.avatar) ?? ""}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full border-4 border-[var(--card)] object-cover shadow-[var(--shadow)] sm:h-24 sm:w-24"
              />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-[var(--card)] bg-[var(--accent-muted)] text-2xl font-semibold text-[var(--accent)] shadow-[var(--shadow)] sm:h-24 sm:w-24 sm:text-3xl">
                {displayName[0]}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-[var(--foreground)] sm:text-2xl">{displayName}</h1>
              <p className="truncate text-[var(--muted)]">{handle}</p>
              {profile?.bio && <p className="mt-2 text-sm text-[var(--muted-foreground)] sm:text-base">{profile.bio}</p>}
            </div>
            <div className="flex flex-wrap gap-2 self-stretch sm:self-auto">
              <Link
                href="/app/profile/edit"
                className="smooth-btn rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent-subtle)]"
              >
                Edit profile
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="smooth-btn rounded-xl bg-[var(--accent-subtle)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent-muted)]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
