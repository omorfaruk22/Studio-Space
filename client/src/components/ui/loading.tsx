import { cn } from "@/lib/utils";

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
