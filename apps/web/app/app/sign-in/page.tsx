"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseAuth } from "@/lib/firebase";
import { isProfileIncomplete } from "@/lib/firestore/users";
import { sanitizeEmail, mapAuthError } from "@/lib/utils/auth";

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, isFirebaseEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  if (!isFirebaseEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
        <div className="text-center">
          <p className="text-[var(--muted)]">
            Sign-in is not configured. Set Firebase env vars to enable auth.
          </p>
          <Link href="/" className="mt-4 inline-block font-medium text-[var(--accent)] hover:underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const e2 = sanitizeEmail(email);
    if (!e2) {
      setError("Please enter a valid email.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(e2, password);
      const uid = getFirebaseAuth()?.currentUser?.uid ?? "";
      const incomplete = uid ? await isProfileIncomplete(uid) : false;
      router.replace(incomplete ? "/app/complete-profile" : "/app/feed");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed.";
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
      const uid = getFirebaseAuth()?.currentUser?.uid ?? "";
      const incomplete = uid ? await isProfileIncomplete(uid) : false;
      router.replace(incomplete ? "/app/complete-profile" : "/app/feed");
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
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="auth-bg-inline absolute inset-0 opacity-60" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md -translate-y-8">
          <div className="app-glass p-6 sm:p-8 md:p-10">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Sign in</h1>
            <p className="mt-1 text-[var(--muted)]">Welcome back to Strivon</p>

            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                  autoComplete="email"
                  disabled={loading || googleLoading}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)]">Password</label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 pr-10 text-[var(--foreground)] placeholder-[var(--muted)] transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                    autoComplete="current-password"
                    disabled={loading || googleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    {passwordVisible ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="app-btn-primary smooth-btn w-full rounded-xl py-3.5 font-semibold disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Sign in"
                )}
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading || appleLoading}
                className="smooth-btn flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] py-3.5 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-subtle)] disabled:opacity-60"
              >
                {googleLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={loading || googleLoading || appleLoading}
                className="smooth-btn flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] py-3.5 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-subtle)] disabled:opacity-60"
              >
                {appleLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c1.32-1.58 1.14-3.84-.56-5.28-1.78-1.45-3.86-1.36-5.22.37-1.27 1.64-1.13 3.84.5 5.28 1.62.49 3.29.4 4.28-.37z" />
                    </svg>
                    Continue with Apple
                  </>
                )}
              </button>
              <div className="text-center">
                <Link href="/app/forgot-password" className="text-sm font-medium text-[var(--accent)] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <p className="text-center text-sm text-[var(--muted)]">
                Don&apos;t have an account?{" "}
                <Link href="/app/sign-up" className="font-semibold text-[var(--accent)] hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
