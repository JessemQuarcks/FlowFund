"use client";

import { useEffect, useRef, useState } from "react";

// Counts from 0 up to `end` the first time it scrolls into view. Formatting is
// configured with serializable props (currency / compact / decimals) so this
// can be rendered from a Server Component without passing a function across the
// boundary.
export function CountUp({
  end,
  duration = 1600,
  decimals = 0,
  prefix = "",
  suffix = "",
  currency,
  compact = false,
  className,
}: {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  currency?: string;
  compact?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const run = () => {
      if (started.current) return;
      started.current = true;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced) {
        setValue(end);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setValue(end * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setValue(end);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && run(),
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [end, duration]);

  const text = new Intl.NumberFormat("en-GH", {
    style: currency ? "currency" : "decimal",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: compact ? 1 : decimals,
  }).format(value);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
