import { cn } from "@/lib/utils";
import { Aperture } from "lucide-react";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn("inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
      role="status"
      aria-label={label}
    />
  );
}

export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-sand", className)}
      aria-hidden="true"
    />
  );
}

export function StudioCardSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <LoadingBlock className="aspect-[1.36] rounded-none bg-sage/70" />
      <div className="space-y-3 p-5">
        <LoadingBlock className="h-5 w-3/4 rounded-lg" />
        <LoadingBlock className="h-4 w-1/2 rounded-lg" />
        <LoadingBlock className="h-4 w-1/3 rounded-lg" />
      </div>
    </div>
  );
}

export function StudioGridSkeleton({
  count = 6,
  label = "Loading studios",
  className,
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, index) => <StudioCardSkeleton key={index} />)}
    </div>
  );
}

export function BookingGridSkeleton({
  count = 2,
  label = "Loading bookings",
}: {
  count?: number;
  label?: string;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <div className="grid sm:grid-cols-[160px_minmax(0,1fr)]">
            <LoadingBlock className="min-h-40 rounded-none bg-sage/70 sm:min-h-full" />
            <div className="space-y-4 p-5">
              <LoadingBlock className="h-6 w-3/4 rounded-lg" />
              <LoadingBlock className="h-4 w-1/2 rounded-lg" />
              <LoadingBlock className="h-4 w-2/3 rounded-lg" />
              <LoadingBlock className="h-4 w-1/3 rounded-lg" />
              <LoadingBlock className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StudioDetailsSkeleton() {
  return (
    <main role="status" aria-label="Loading studio details" aria-busy="true" className="mx-auto w-full max-w-page flex-1 px-5 py-8 sm:px-8 sm:py-10 xl:px-12">
      <LoadingBlock className="mb-6 h-10 w-44 rounded-full" />
      <LoadingBlock className="aspect-[1.8] rounded-[2rem] bg-sage/70" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5" aria-hidden="true">
          <LoadingBlock className="h-5 w-40 rounded-lg" />
          <LoadingBlock className="h-12 w-3/4 rounded-lg" />
          <LoadingBlock className="h-5 w-1/2 rounded-lg" />
          <LoadingBlock className="mt-10 h-7 w-52 rounded-lg" />
          <LoadingBlock className="h-24 rounded-2xl" />
        </div>
        <LoadingBlock className="h-72 rounded-3xl bg-sage/70" />
      </div>
    </main>
  );
}

export function StudioFormSkeleton() {
  return (
    <div role="status" aria-label="Loading studio form" aria-busy="true" className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-2">
            <LoadingBlock className="h-4 w-28 rounded-lg" />
            <LoadingBlock className="h-12 rounded-2xl" />
          </div>
        ))}
        <LoadingBlock className="h-28 rounded-2xl sm:col-span-2" />
      </div>
      <span className="sr-only">Loading your studio details…</span>
    </div>
  );
}

export function AppRouteSkeleton() {
  return (
    <main role="status" aria-label="Loading StudioSpace page" aria-busy="true" className="mx-auto w-full max-w-page flex-1 px-5 py-12 sm:px-8 sm:py-16 xl:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-forest shadow-card">
          <Aperture size={18} className="studio-loading-spin" aria-hidden="true" />Preparing your creative space
        </div>
        <div aria-hidden="true" className="space-y-4">
          <LoadingBlock className="h-10 w-3/4 rounded-xl sm:h-12" />
          <LoadingBlock className="h-5 w-full max-w-xl rounded-lg" />
          <LoadingBlock className="h-5 w-2/3 max-w-lg rounded-lg" />
          <div className="grid gap-4 pt-7 sm:grid-cols-2">
            <LoadingBlock className="h-52 rounded-3xl bg-sage/70" />
            <LoadingBlock className="h-52 rounded-3xl bg-sage/70" />
          </div>
        </div>
      </div>
    </main>
  );
}
