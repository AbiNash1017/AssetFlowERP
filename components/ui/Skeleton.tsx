import * as React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render as a circle (for avatars) */
  circle?: boolean;
  /** Height in tailwind units (default: h-4) */
  height?: string;
  /** Width in tailwind units (default: w-full) */
  width?: string;
}

export function Skeleton({
  className = "",
  circle = false,
  height = "h-4",
  width = "w-full",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse rounded bg-muted",
        circle ? "rounded-full" : "rounded-md",
        height,
        width,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

/** Pre-built table row skeleton */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height="h-4" width={i === 0 ? "w-3/4" : "w-1/2"} />
        </td>
      ))}
    </tr>
  );
}

/** Pre-built KPI card skeleton */
export function KpiCardSkeleton() {
  return (
    <div className="premium-card rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton height="h-4" width="w-1/3" />
        <Skeleton height="h-8" width="w-8" circle />
      </div>
      <Skeleton height="h-8" width="w-1/2" />
      <Skeleton height="h-3" width="w-2/3" />
    </div>
  );
}
