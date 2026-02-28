"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getFirestoreUser, setFirestoreUser } from "@/lib/firestore/users";

function normalizeHandle(input: string): string {
  return input
    .replace(/^@/, "")
    .replace(/[^a-z0-9_]/gi, "")
    .slice(0, 30)
    .toLowerCase();
}

export default function CompleteProfilePage() {
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
    (async () => {
      try {
        const profile = await getFirestoreUser(user.uid);
        if (profile) {
          setName(profile.name || "");
          setUsername(profile.handle?.replace(/^@/, "") || "");
          setOccupation(profile.occupation || "");
          setCountry(profile.country || "");
          setBio(profile.bio || "");
        }
      } catch {
        // keep defaults
      } finally {
        setInitializing(false);
      }
    })();
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
      setError("Username must be at least 3 characters (letters, numbers, or underscore).");
      return;
    }
    if (!user?.uid) {
      setError("Not signed in.");
      return;
    }
    setLoading(true);
    try {
      await setFirestoreUser(user.uid, {
        name: displayName,
        handle: `@${handleValue}`,
        occupation: occupation.trim() || undefined,
        country: country.trim() || undefined,
        bio: bio.trim() || undefined,
        profileCompleted: true,
      });
      router.replace("/app/feed");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseEnabled || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900 p-6">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Please sign in first.</p>
          <Link href="/app/sign-in" className="mt-4 inline-block text-blue-600 hover:underline">Sign in</Link>
        </div>
      </div>
    );
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-900">
      <div className="auth-bg-inline absolute inset-0 opacity-60" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-xl backdrop-blur dark:bg-zinc-900/95 dark:border-zinc-700">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Complete your profile</h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">Add a few details so others can find you.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Display name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username (min 3 characters)"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Occupation (optional)</label>
                <input
                  id="occupation"
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Founder, Designer"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Country (optional)</label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Bio (optional)</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short bio..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
