import { useState, useCallback, useRef, useEffect } from 'react';

const DEFAULT_TIMEOUT_MS = 20000;

export interface UseLoadingWithTimeoutOptions {
  timeoutMs?: number;
  onTimeout?: () => void;
}

/**
 * Loading state with optional timeout. After timeoutMs, sets timedOut true so UI can show "Taking longer than usual" + retry.
 */
export function useLoadingWithTimeout(
  initialLoading = false,
  options: UseLoadingWithTimeoutOptions = {}
) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, onTimeout } = options;
  const [loading, setLoading] = useState(initialLoading);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startLoading = useCallback(() => {
    setLoading(true);
    setTimedOut(false);
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setTimedOut(true);
      onTimeout?.();
    }, timeoutMs);
  }, [timeoutMs, onTimeout, clearTimer]);

  const stopLoading = useCallback(() => {
    setLoading(false);
    setTimedOut(false);
    clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return { loading, timedOut, startLoading, stopLoading, setLoading };
}
