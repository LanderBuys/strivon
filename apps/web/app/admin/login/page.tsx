"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const firebaseConfigured = isFirebaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Firebase is not configured. Fill in apps/web/.env.local with your Firebase config (see apps/web/FIREBASE_ENV.md). Get values from Firebase Console → Project settings → Your apps.");
      setLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/admin");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed.";
      setError(message.includes("auth/") ? "Invalid email or password." : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0c0d0f] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl border border-white/10 bg-[rgba(18,20,24,0.9)] backdrop-blur-xl shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Admin sign in</h1>
            <p className="mt-2 text-sm text-slate-400">Strivon dashboard</p>
          </div>
          {!firebaseConfigured && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 mb-6">
              <strong>Firebase not configured.</strong> Edit <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">apps/web/.env.local</code> and set all six <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_FIREBASE_*</code> variables. Get the values from{" "}
              <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline text-violet-400 hover:text-violet-300">Firebase Console</a>
              {" "}→ your project → Project settings → General → Your apps. Restart the dev server after saving.
            </div>
          )}
          {sessionExpired && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 mb-6">
              Your session expired. Please sign in again.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/40 py-3 text-sm font-semibold hover:bg-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-400 hover:text-violet-400 transition-colors">Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0c0d0f] flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-white/10 border-t-violet-400 animate-spin" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
