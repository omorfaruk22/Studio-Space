"use client";

import { toast } from "sonner";
import { CalendarDays } from "lucide-react";

export function BookingNoticeButton() {
  return (
    <button
      type="button"
      onClick={() => toast.info("Online booking is not available yet. Please check back soon.")}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <CalendarDays size={17} aria-hidden="true" /> Book workspace now
    </button>
  );
}
