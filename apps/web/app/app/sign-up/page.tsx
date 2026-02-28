"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { sanitizeEmail, mapAuthError } from "@/lib/utils/auth";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple, isFirebaseEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  if (!isFirebaseEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900 p-6">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Sign-up is not configured.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">Go back</Link>
        </div>
      </div>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const e2 = sanitizeEmail(email);
    if (!e2) {
      setError("Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signUp(e2, password);
      router.replace("/app/verify-email");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-up failed.";
      setError(message.includes("auth/") ? mapAuthError(message) : message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/app/feed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      if (msg !== "Sign-in was cancelled.") setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    setAppleLoading(true);
    try {
      await signInWithApple();
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const { isProfileIncomplete } = await import("@/lib/firestore/users");
      const uid = getFirebaseAuth()?.currentUser?.uid ?? "";
      const incomplete = uid ? await isProfileIncomplete(uid) : false;
      router.replace(incomplete ? "/app/complete-profile" : "/app/feed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Apple sign-in failed.";
      if (msg !== "Sign-in was cancelled.") setError(msg);
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-900">
      <div className="auth-bg-inline absolute inset-0 opacity-60" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md -translate-y-8">
          <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-xl backdrop-blur dark:bg-zinc-900/95 dark:border-zinc-700 sm:p-8">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create account</h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">Join Strivon</p>

            <form onSubmit={handleSignUp} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  autoComplete="email"
                  disabled={loading || googleLoading || appleLoading}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 pr-10 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    autoComplete="new-password"
                    disabled={loading || googleLoading || appleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    {passwordVisible ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm password</label>
                <input
                  id="confirmPassword"
                  type={passwordVisible ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  autoComplete="new-password"
                  disabled={loading || googleLoading || appleLoading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || googleLoading || appleLoading}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Sign up"}
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading || appleLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-zinc-50 py-3.5 font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-60"
              >
                {googleLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" /> : "Continue with Google"}
              </button>
              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={loading || googleLoading || appleLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-zinc-50 py-3.5 font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-60"
              >
                {appleLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" /> : "Continue with Apple"}
              </button>
              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                Already have an account?{" "}
                <Link href="/app/sign-in" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">Sign in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
