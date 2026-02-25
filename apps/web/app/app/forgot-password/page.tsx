"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { sanitizeEmail, mapAuthError } from "@/lib/utils/auth";

export default function ForgotPasswordPage() {
  const { sendPasswordReset, isFirebaseEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!isFirebaseEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900 p-6">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Password reset is not configured.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">Go back</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const e2 = sanitizeEmail(email);
    if (!e2) {
      setError("Please enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(e2);
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset email.";
      setError(message.includes("auth/") ? mapAuthError(message) : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-900">
      <Image src="/strivonbackgroundimagedesktop.jpeg" alt="" fill className="object-cover opacity-60" priority />
      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-xl backdrop-blur dark:bg-zinc-900/95 dark:border-zinc-700">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Forgot password?</h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            {sent ? (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200">
                Check your email for a link to reset your password.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Send reset link"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/app/sign-in" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
