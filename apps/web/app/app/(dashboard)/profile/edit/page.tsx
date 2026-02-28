"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getFirestoreUser, setFirestoreUser } from "@/lib/firestore/users";

function normalizeHandle(input: string): string {
  return input.replace(/^@/, "").replace(/[^a-z0-9_]/gi, "").slice(0, 30).toLowerCase();
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, isFirebaseEnabled } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [occupation, setOccupation] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid || !isFirebaseEnabled) {
      setInitializing(false);
      return;
    }
    getFirestoreUser(user.uid)
      .then((profile) => {
        if (profile) {
          setName(profile.name || "");
          setUsername(profile.handle?.replace(/^@/, "") || "");
          setOccupation(profile.occupation || "");
          setCountry(profile.country || "");
          setBio(profile.bio || "");
        }
      })
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, [user?.uid, isFirebaseEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const displayName = name.trim();
    if (!displayName) {
      setError("Please enter your display name.");
      return;
    }
    const handleValue = normalizeHandle(username);
    if (handleValue.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!user?.uid) return;
    setLoading(true);
    try {
      await setFirestoreUser(user.uid, {
        name: displayName,
        handle: `@${handleValue}`,
        occupation: occupation.trim() || undefined,
        country: country.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      router.push("/app/profile");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-[var(--muted)]">Please sign in.</p>
        <Link href="/app/sign-in" className="mt-4 inline-block font-medium text-[var(--accent)] hover:underline">Sign in</Link>
      </div>
    );
  }

  if (initializing) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="h-64 animate-pulse rounded-2xl bg-[var(--card)] ring-1 ring-[var(--card-border)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link href="/app/profile" className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] sm:mb-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to profile
      </Link>
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)] sm:mb-6 sm:text-xl">Edit profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 sm:p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">{error}</div>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Display name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" disabled={loading} />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</label>
          <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" disabled={loading} />
        </div>
        <div>
          <label htmlFor="occupation" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Occupation (optional)</label>
          <input id="occupation" type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" disabled={loading} />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Country (optional)</label>
          <input id="country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" disabled={loading} />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Bio (optional)</label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" disabled={loading} />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {loading ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
