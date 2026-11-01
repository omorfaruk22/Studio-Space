"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/booking-types";

type BookingDialogButtonProps = {
  studio: {
    id: string;
    title: string;
    hourlyRate: number;
    securityDeposit: number;
    maxCapacity: number;
  };
  isAuthenticated: boolean;
};

type BookingResponse = { message?: string };

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeInMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function BookingDialogButton({ studio, isAuthenticated }: BookingDialogButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [numberOfPeople, setNumberOfPeople] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const startMinutes = timeInMinutes(startTime);
  const endMinutes = timeInMinutes(endTime);
  const durationMinutes = startMinutes !== null && endMinutes !== null && endMinutes > startMinutes
    ? endMinutes - startMinutes
    : 0;
  const estimatedTotal = Math.round((studio.hourlyRate * durationMinutes / 60) * 100) / 100;
  const guestCount = Number(numberOfPeople);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (durationMinutes < 1) {
      setError("Choose an end time that is later than the start time.");
      return;
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > studio.maxCapacity) {
      setError(`Choose between 1 and ${studio.maxCapacity} people.`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          studioId: studio.id,
          bookingDate,
          startTime,
          endTime,
          numberOfPeople: guestCount,
          timeZoneOffsetMinutes: new Date(`${bookingDate}T${startTime}:00`).getTimezoneOffset(),
        }),
      });
      const result = await response.json() as BookingResponse;
      if (!response.ok) throw new Error(result.message || "We could not create your booking.");
      toast.success("Booking request sent to the host.");
      setOpen(false);
      router.push("/my-bookings");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not connect to the booking service.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/studios/${studio.id}`)}`} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <CalendarDays size={17} aria-hidden="true" /> Log in to book
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const localToday = localDateString(new Date());
          setToday(localToday);
          if (!bookingDate || bookingDate < localToday) setBookingDate(localToday);
          setError("");
          setOpen(true);
        }}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <CalendarDays size={17} aria-hidden="true" /> Book workspace now
      </button>
      <Dialog open={open} title="Request a booking" description={`Choose the date and hours for ${studio.title}.`} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p> : null}
          <FormField label="Booking date" htmlFor="bookingDate" required>
            <Input id="bookingDate" type="date" required min={today || undefined} value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start time" htmlFor="startTime" required>
              <Input id="startTime" type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </FormField>
            <FormField label="End time" htmlFor="endTime" required>
              <Input id="endTime" type="time" required value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </FormField>
          </div>
          <FormField label="Number of people" htmlFor="numberOfPeople" required hint={`This studio can host up to ${studio.maxCapacity} people.`}>
            <Input id="numberOfPeople" type="number" required min={1} max={studio.maxCapacity} step={1} value={numberOfPeople} onChange={(event) => setNumberOfPeople(event.target.value)} />
          </FormField>

          <div className="rounded-2xl bg-sand/70 p-4 text-sm">
            <p className="font-semibold text-ink">Price summary</p>
            <div className="mt-3 space-y-2 text-muted">
              <p className="flex justify-between gap-4"><span>Rental ({durationMinutes ? formatDuration(durationMinutes) : "choose valid hours"})</span><span className="font-medium text-ink">${estimatedTotal.toFixed(2)}</span></p>
              <p className="flex justify-between gap-4"><span>Rate</span><span>${studio.hourlyRate.toFixed(2)} / hr</span></p>
              <p className="flex justify-between gap-4 border-t border-line pt-2"><span>Security deposit (separate)</span><span className="font-semibold text-ink">{studio.securityDeposit > 0 ? `$${studio.securityDeposit.toFixed(2)}` : "None"}</span></p>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">The host will review this request. No payment is collected in this phase.</p>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting || !bookingDate || durationMinutes < 1 || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > studio.maxCapacity}>
            {submitting ? "Sending request…" : "Confirm booking request"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
