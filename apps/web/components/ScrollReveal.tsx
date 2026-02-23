"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Variant = "fade-up" | "fade-in" | "scale";

const variantClasses: Record<Variant, { base: string; inView: string }> = {
  "fade-up": {
    base: "scroll-reveal scroll-reveal-fade-up",
    inView: "scroll-reveal-in",
  },
  "fade-in": {
    base: "scroll-reveal scroll-reveal-fade-in",
    inView: "scroll-reveal-in",
  },
  scale: {
    base: "scroll-reveal scroll-reveal-scale",
    inView: "scroll-reveal-in",
  },
};

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  /** Delay in ms before the reveal animation starts (for stagger) */
  delay?: number;
  /** How much of the element must be visible (0-1). Default 0.12 */
  threshold?: number;
  /** Root margin e.g. "0px 0px -80px 0px" to trigger a bit before fully in view */
  rootMargin?: string;
}

export function ScrollReveal({
  children,
  className = "",
  variant = "fade-up",
  delay = 0,
  threshold = 0.12,
  rootMargin = "0px 0px -60px 0px",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              timeoutId = setTimeout(() => setInView(true), delay);
            } else {
              setInView(true);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [threshold, rootMargin, delay]);

  const { base, inView: inViewClass } = variantClasses[variant];

  return (
    <div
      ref={ref}
      className={`${base} ${inView ? inViewClass : ""} ${className}`.trim()}
      style={delay > 0 && inView ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
