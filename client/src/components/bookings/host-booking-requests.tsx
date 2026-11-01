"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock3, RefreshCw, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { BookingGridSkeleton, Spinner } from "@/components/ui/loading";
import { formatDuration, type BookingStatus } from "@/lib/booking-types";

type Booking = {
  id: string;
  studioId: string;
  studio: { title: string; image: string; location: string };
  bookingDate: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  durationMinutes: number;
  totalPrice: number;
  securityDeposit: number;
  status: BookingStatus;
};

type BookingResponse = { bookings?: Booking[]; booking?: Booking; message?: string };

async function fetchBookings(): Promise<Booking[]> {
  const response = await fetch("/api/host/bookings", { cache: "no-store", credentials: "same-origin" });
  const result = await response.json() as BookingResponse;
  if (!response.ok || !Array.isArray(result.bookings)) throw new Error(result.message || "Could not load booking requests.");
  return result.bookings;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hours, minutes));
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

const statusStyles: Record<BookingStatus, string> = {
  Pending: "bg-amber-50 text-amber-800",
  Confirmed: "bg-emerald-50 text-emerald-800",
  Completed: "bg-sage text-forest",
  Cancelled: "bg-sand text-muted",
  Declined: "bg-red-50 text-red-800",
};

export function HostBookingRequests() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [busyAction, setBusyAction] = useState<"confirm" | "decline" | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBookings(await fetchBookings());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load booking requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchBookings()
      .then((items) => { if (active) setBookings(items); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load booking requests."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function updateBooking(booking: Booking, action: "confirm" | "decline") {
    setBusyId(booking.id);
    setBusyAction(action);
    try {
      const response = await fetch(`/api/host/bookings/${booking.id}/${action}`, {
        method: "PATCH",
        credentials: "same-origin",
      });
      const result = await response.json() as BookingResponse;
      if (!response.ok || !result.booking) throw new Error(result.message || `Could not ${action} this request.`);
      setBookings((current) => current.map((item) => item.id === booking.id ? result.booking! : item));
      toast.success(action === "confirm" ? "Booking confirmed." : "Booking request declined.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : `Could not ${action} this request.`);
      if (action === "confirm") await loadBookings();
    } finally {
      setBusyId("");
      setBusyAction(null);
    }
  }

  return (
    <div className="mt-7 space-y-4" aria-live="polite" aria-busy={loading || Boolean(busyId)}>
      {loading ? <BookingGridSkeleton label="Loading booking requests" /> : null}
      {!loading && error ? <Card><CardContent className="px-6 py-10 text-center"><p className="text-sm text-muted" role="alert">{error}</p><button type="button" onClick={() => void loadBookings()} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-strong"><RefreshCw size={15} aria-hidden="true" />Try again</button></CardContent></Card> : null}
      {!loading && !error && bookings.length === 0 ? <Card><CardContent className="px-6 py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sage text-forest"><CalendarDays size={22} aria-hidden="true" /></span><h2 className="mt-4 font-serif text-2xl text-ink">No booking requests yet</h2><p className="mt-2 text-sm text-muted">Requests for your studio listings will appear here.</p></CardContent></Card> : null}
      {!loading && !error && bookings.length > 0 ? <div className="grid gap-4 lg:grid-cols-2">{bookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <div className="grid sm:grid-cols-[160px_minmax(0,1fr)]">
            <div className="relative min-h-40 bg-sage sm:min-h-full"><Image src={booking.studio.image} alt={booking.studio.title} fill unoptimized sizes="160px" className="object-cover" /></div>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">{booking.studio.location}</p><h2 className="mt-1 font-serif text-xl text-ink">{booking.studio.title}</h2></div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[booking.status]}`}>{booking.status}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex items-center gap-2 text-ink"><CalendarDays size={15} className="text-muted" aria-hidden="true" />{formatDate(booking.bookingDate)}</p>
                <p className="flex items-center gap-2 text-ink"><Clock3 size={15} className="text-muted" aria-hidden="true" />{formatTime(booking.startTime)}–{formatTime(booking.endTime)} ({formatDuration(booking.durationMinutes)})</p>
                <p className="flex items-center gap-2 text-ink"><UsersRound size={15} className="text-muted" aria-hidden="true" />{booking.numberOfPeople} {booking.numberOfPeople === 1 ? "person" : "people"}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
                <div><p className="text-xs text-muted">Rental total</p><p className="mt-1 font-semibold text-ink">{money(booking.totalPrice)}</p><p className="mt-1 text-xs text-muted">Deposit: {booking.securityDeposit ? money(booking.securityDeposit) : "None"}</p></div>
                {booking.status === "Pending" ? <div className="flex gap-2"><button type="button" disabled={busyId === booking.id} onClick={() => void updateBooking(booking, "decline")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink hover:bg-sand disabled:cursor-wait disabled:opacity-50">{busyId === booking.id && busyAction === "decline" ? <Spinner className="size-4" label="Declining request" /> : null}{busyId === booking.id && busyAction === "decline" ? "Declining…" : "Decline"}</button><button type="button" disabled={busyId === booking.id} onClick={() => void updateBooking(booking, "confirm")} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-strong disabled:cursor-wait disabled:opacity-50">{busyId === booking.id && busyAction === "confirm" ? <Spinner className="size-4" label="Confirming request" /> : null}{busyId === booking.id && busyAction === "confirm" ? "Confirming…" : "Confirm"}</button></div> : null}
              </div>
            </CardContent>
          </div>
        </Card>
      ))}</div> : null}
    </div>
  );
}
