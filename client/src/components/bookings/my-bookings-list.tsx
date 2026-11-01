"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock3, Download, MapPin, RefreshCw, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
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
  hourlyRate: number;
  totalPrice: number;
  securityDeposit: number;
  status: BookingStatus;
};

type BookingsResponse = { bookings?: Booking[]; message?: string };

async function fetchBookings(): Promise<Booking[]> {
  const response = await fetch("/api/my-bookings", { cache: "no-store", credentials: "same-origin" });
  const result = (await response.json()) as BookingsResponse;
  if (!response.ok || !Array.isArray(result.bookings)) {
    throw new Error(result.message || "Could not load your bookings.");
  }
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

export function MyBookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [invoiceBookingId, setInvoiceBookingId] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBookings(await fetchBookings());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchBookings()
      .then((items) => { if (active) setBookings(items); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your bookings.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function cancelBooking() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const response = await fetch(`/api/bookings/${cancelTarget.id}/cancel`, {
        method: "PATCH",
        credentials: "same-origin",
      });
      const result = await response.json() as { booking?: Booking; message?: string };
      if (!response.ok || !result.booking) throw new Error(result.message || "Could not cancel this booking.");
      setBookings((current) => current.map((booking) => booking.id === cancelTarget.id ? result.booking! : booking));
      setCancelTarget(null);
      toast.success("Booking request cancelled.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not cancel this booking.");
    } finally {
      setCancelling(false);
    }
  }

  async function downloadInvoice(booking: Booking) {
    setInvoiceBookingId(booking.id);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/invoice`, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) {
        const result = await response.json() as { message?: string };
        throw new Error(result.message || "Could not download this booking summary.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `studio-booking-${booking.id}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not download this booking summary.");
    } finally {
      setInvoiceBookingId("");
    }
  }

  return (
    <>
      <div className="mt-7 space-y-4" aria-live="polite" aria-busy={loading || cancelling}>
        {loading ? <BookingGridSkeleton /> : null}
        {!loading && error ? <Card><CardContent className="px-6 py-10 text-center"><p className="text-sm text-muted" role="alert">{error}</p><button type="button" onClick={() => void loadBookings()} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-strong"><RefreshCw size={15} aria-hidden="true" />Try again</button></CardContent></Card> : null}
        {!loading && !error && bookings.length === 0 ? <Card><CardContent className="px-6 py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sage text-forest"><CalendarDays size={22} aria-hidden="true" /></span><h2 className="mt-4 font-serif text-2xl text-ink">No bookings yet</h2><p className="mt-2 text-sm text-muted">When you request a studio, its details and status will appear here.</p><Link href="/studios" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-strong">Explore studios</Link></CardContent></Card> : null}
        {!loading && !error && bookings.length > 0 ? <div className="grid gap-4 lg:grid-cols-2">{bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
              <div className="relative min-h-44 bg-sage sm:min-h-full">
                <Image src={booking.studio.image} alt={booking.studio.title} fill unoptimized sizes="180px" className="object-cover" />
              </div>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-serif text-xl text-ink">{booking.studio.title}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[booking.status]}`}>{booking.status}</span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><MapPin size={14} aria-hidden="true" />{booking.studio.location}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-ink"><CalendarDays size={15} className="text-muted" aria-hidden="true" />{formatDate(booking.bookingDate)}</p>
                  <p className="flex items-center gap-2 text-ink"><Clock3 size={15} className="text-muted" aria-hidden="true" />{formatTime(booking.startTime)}–{formatTime(booking.endTime)} ({formatDuration(booking.durationMinutes)})</p>
                  <p className="flex items-center gap-2 text-ink"><UsersRound size={15} className="text-muted" aria-hidden="true" />{booking.numberOfPeople} {booking.numberOfPeople === 1 ? "person" : "people"}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
                  <div><p className="text-xs text-muted">Rental total</p><p className="mt-1 font-semibold text-ink">{money(booking.totalPrice)}</p><p className="mt-1 text-xs text-muted">Deposit: {booking.securityDeposit ? money(booking.securityDeposit) : "None"}</p></div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {booking.status === "Confirmed" ? <button type="button" onClick={() => void downloadInvoice(booking)} disabled={invoiceBookingId === booking.id} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-xs font-semibold text-ink hover:bg-sand disabled:cursor-wait disabled:opacity-50">{invoiceBookingId === booking.id ? <Spinner className="size-3.5" label="Downloading booking PDF" /> : <Download size={14} aria-hidden="true" />}{invoiceBookingId === booking.id ? "Preparing PDF…" : "Download PDF"}</button> : null}
                    {booking.status === "Pending" ? <button type="button" onClick={() => setCancelTarget(booking)} className="min-h-9 rounded-full border border-line px-3.5 text-xs font-semibold text-ink hover:bg-sand">Cancel request</button> : null}
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}</div> : null}
      </div>
      <Dialog
        open={Boolean(cancelTarget)}
        title="Cancel this booking request?"
        description={cancelTarget ? `${cancelTarget.studio.title} · ${formatDate(cancelTarget.bookingDate)}` : undefined}
        onClose={() => { if (!cancelling) setCancelTarget(null); }}
      >
        <div className="flex justify-end gap-3">
          <button type="button" disabled={cancelling} onClick={() => setCancelTarget(null)} className="min-h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink hover:bg-sand disabled:cursor-wait disabled:opacity-50">Keep booking</button>
          <button type="button" disabled={cancelling} onClick={() => void cancelBooking()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-50">{cancelling ? <Spinner className="size-4" label="Cancelling booking" /> : null}{cancelling ? "Cancelling…" : "Cancel booking"}</button>
        </div>
      </Dialog>
    </>
  );
}
