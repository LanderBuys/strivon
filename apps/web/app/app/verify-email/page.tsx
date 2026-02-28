"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseAuth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, sendVerificationEmail, reloadUser, isFirebaseEnabled } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

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

  if (user.emailVerified) {
    router.replace("/app/feed");
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
      </div>
    );
  }

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      await sendVerificationEmail();
      setSent(true);
    } catch {
      setError("Failed to send email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    setError("");
    setLoading(true);
    try {
      await reloadUser();
      const auth = getFirebaseAuth();
      if (auth?.currentUser?.emailVerified) router.replace("/app/feed");
    } catch {
      setError("Could not refresh. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-900">
      <div className="auth-bg-inline absolute inset-0 opacity-60" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-xl backdrop-blur dark:bg-zinc-900/95 dark:border-zinc-700">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Verify your email</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              We sent a verification link to <strong>{user.email}</strong>. Click the link in that email to verify your account.
            </p>
            {sent && (
              <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/50 dark:text-green-200">
                Verification email sent. Check your inbox.
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">{error}</p>
            )}
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleCheck}
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "I verified my email"}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 py-3.5 font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-60"
              >
                Resend verification email
              </button>
            </div>
            <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/app/sign-in" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
