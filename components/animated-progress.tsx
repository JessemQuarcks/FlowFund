"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// A gradient progress bar that grows from 0 to `value`% when scrolled into
// view. `value` is a percentage (0–100); it is clamped and never overflows.
export function AnimatedProgress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const target = Math.max(0, Math.min(100, value));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          // Next frame so the transition runs from 0.
          requestAnimationFrame(() => setWidth(target));
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/40",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(target)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("progress-gradient h-full rounded-full", barClassName)}
        style={{
          width: `${width}%`,
          transition: "width 1.1s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </div>
  );
}
