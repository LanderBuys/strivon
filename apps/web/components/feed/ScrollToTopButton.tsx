"use client";

interface ScrollToTopButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToTopButton({ visible, onClick }: ScrollToTopButtonProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="smooth-btn fixed bottom-20 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)] active:opacity-90"
      aria-label="Scroll to top"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  );
}
