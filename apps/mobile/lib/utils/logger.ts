/**
 * App logger. In __DEV__ logs to console; in production no-ops unless reportError is set.
 * Use instead of console.log/warn/error so production stays quiet and errors can be sent
 * to Sentry, Firebase Crashlytics, etc. by assigning logger.reportError.
 */

const isDev = typeof __DEV__ !== "undefined" && __DEV__;

/** Optional: set to send production errors to your service (e.g. Sentry, Crashlytics). */
export let reportError: ((error: unknown, context?: Record<string, unknown>) => void) | null = null;

export function setReportError(fn: ((error: unknown, context?: Record<string, unknown>) => void) | null): void {
  reportError = fn;
}

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log("[Strivon]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn("[Strivon]", ...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error("[Strivon]", ...args);
    if (!isDev && reportError && args.length > 0) {
      reportError(args[0] instanceof Error ? args[0] : new Error(String(args[0])));
    }
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug("[Strivon]", ...args);
  },
};
