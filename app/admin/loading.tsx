import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div
      className="container py-8"
      role="status"
      aria-live="polite"
      aria-label="Loading moderation console"
    >
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-[70vw]" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-soft"
          >
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-28 rounded-md" />
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-20 items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-soft"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-52 max-w-[50vw]" />
              <Skeleton className="h-3 w-72 max-w-[65vw]" />
            </div>
            <Skeleton className="h-9 w-24 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
