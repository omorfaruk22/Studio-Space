"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Pencil, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/loading";
import { studioCategoryLabels, type StudioCategory } from "@/lib/studio-types";
import type { BookingStatus } from "@/lib/booking-types";

type AdminStudio = {
  id: string;
  title: string;
  category: StudioCategory;
  location: string;
  hourlyRate: number;
  ownerName: string;
  ownerEmail: string;
  isAvailable: boolean;
  createdAt?: string;
};

type AdminBooking = {
  id: string;
  studioTitle: string;
  studioLocation: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt?: string;
};

type AdminOverview = {
  stats: {
    studioCount: number;
    liveStudioCount: number;
    hiddenStudioCount: number;
    bookingCount: number;
    pendingBookingCount: number;
    confirmedBookingCount: number;
  };
  studios: AdminStudio[];
  bookings: AdminBooking[];
};

type ApiResponse = Partial<AdminOverview> & { message?: string };

async function fetchAdminOverview(): Promise<AdminOverview> {
  const response = await fetch("/api/admin/overview", { cache: "no-store", credentials: "same-origin" });
  const result = (await response.json()) as ApiResponse;
  if (!response.ok || !result.stats || !Array.isArray(result.studios) || !Array.isArray(result.bookings)) {
    if (response.status === 403) {
      throw new Error("This account is not an admin yet. Add this email to ADMIN_EMAILS in Render, then redeploy the API.");
    }
    if (response.status === 401) throw new Error("Your login session expired. Log in again to continue.");
    throw new Error(result.message || "Could not load the admin dashboard.");
  }
  return result as AdminOverview;
}

function displayDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyStudioId, setBusyStudioId] = useState("");
  const [bookingStatusDrafts, setBookingStatusDrafts] = useState<Record<string, BookingStatus>>({});
  const [savingBookingId, setSavingBookingId] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await fetchAdminOverview());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the admin dashboard.");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchAdminOverview()
      .then((data) => {
        if (active) {
          setOverview(data);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load the admin dashboard.");
          setOverview(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  async function toggleStudio(studio: AdminStudio) {
    setBusyStudioId(studio.id);
    try {
      const response = await fetch(`/api/admin/studios/${studio.id}/availability`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ isAvailable: !studio.isAvailable }),
      });
      const result = (await response.json()) as { studio?: { id: string; isAvailable: boolean }; message?: string };
      if (!response.ok || !result.studio) throw new Error(result.message || "Could not update this studio.");
      const isAvailable = result.studio.isAvailable;
      setOverview((current) => current ? {
        ...current,
        studios: current.studios.map((item) => item.id === studio.id ? { ...item, isAvailable } : item),
        stats: {
          ...current.stats,
          liveStudioCount: current.stats.liveStudioCount + (isAvailable ? 1 : -1),
          hiddenStudioCount: current.stats.hiddenStudioCount + (isAvailable ? -1 : 1),
        },
      } : current);
      toast.success(isAvailable ? "Studio is visible in search." : "Studio is hidden from search.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update this studio.");
    } finally {
      setBusyStudioId("");
    }
  }

  async function saveBookingStatus(booking: AdminBooking) {
    const status = bookingStatusDrafts[booking.id] ?? booking.status;
    if (status === booking.status) return;

    setSavingBookingId(booking.id);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as { booking?: { id: string; status: BookingStatus }; message?: string };
      if (!response.ok || !result.booking) throw new Error(result.message || "Could not update this booking.");

      const updatedStatus = result.booking.status;
      setOverview((current) => current ? {
        ...current,
        bookings: current.bookings.map((item) => item.id === booking.id ? { ...item, status: updatedStatus } : item),
        stats: {
          ...current.stats,
          pendingBookingCount: current.stats.pendingBookingCount + Number(updatedStatus === "Pending") - Number(booking.status === "Pending"),
          confirmedBookingCount: current.stats.confirmedBookingCount + Number(updatedStatus === "Confirmed") - Number(booking.status === "Confirmed"),
        },
      } : current);
      setBookingStatusDrafts((current) => {
        const next = { ...current };
        delete next[booking.id];
        return next;
      });
      toast.success("Booking status updated.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update this booking.");
    } finally {
      setSavingBookingId("");
    }
  }

  const stats = overview?.stats;
  const metrics = [
    { label: "All studios", value: stats?.studioCount ?? 0 },
    { label: "Visible studios", value: stats?.liveStudioCount ?? 0 },
    { label: "Hidden studios", value: stats?.hiddenStudioCount ?? 0 },
    { label: "All bookings", value: stats?.bookingCount ?? 0 },
    { label: "Pending bookings", value: stats?.pendingBookingCount ?? 0 },
    { label: "Confirmed bookings", value: stats?.confirmedBookingCount ?? 0 },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-strong"><ShieldCheck size={15} aria-hidden="true" /> Restricted admin area</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">Platform overview</h1>
          <p className="mt-3 text-sm text-muted">Signed in as {adminEmail}. Review listings and recent booking activity.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadOverview()} disabled={loading}>
          {loading ? <Spinner className="size-4" label="Refreshing admin data" /> : <RefreshCw size={16} aria-hidden="true" />}
          Refresh
        </Button>
      </div>

      {error ? (
        <Card><CardContent className="p-6 sm:p-8">
          <p className="text-sm leading-6 text-red-800" role="alert">{error}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => void loadOverview()} disabled={loading}>Try again</Button>
        </CardContent></Card>
      ) : null}

      <section aria-label="Platform totals" aria-busy={loading} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5 sm:p-6">
              <p className="text-sm font-medium text-muted">{metric.label}</p>
              <p className="mt-2 font-serif text-3xl text-ink">{loading ? "—" : metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-labelledby="admin-studios-heading">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Moderation</p>
          <h2 id="admin-studios-heading" className="mt-2 font-serif text-3xl text-ink">Studio listings</h2>
        </div>
        {loading ? <Card><CardContent className="p-6 text-sm text-muted">Loading studio listings…</CardContent></Card> : null}
        {!loading && overview && overview.studios.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted">No studio listings yet.</CardContent></Card> : null}
        {!loading && overview && overview.studios.length > 0 ? (
          <div className="grid gap-3">
            {overview.studios.map((studio) => (
              <Card key={studio.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-xl text-ink">{studio.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${studio.isAvailable ? "bg-emerald-50 text-emerald-800" : "bg-sand text-muted"}`}>{studio.isAvailable ? "Visible" : "Hidden"}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{studioCategoryLabels[studio.category]} · {studio.location}</p>
                    <p className="mt-1 text-sm text-muted">Host: {studio.ownerName} · {studio.ownerEmail}</p>
                    <p className="mt-1 text-xs text-muted">${studio.hourlyRate} / hour · Added {displayDate(studio.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/studios/${studio.id}/edit`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-strong">
                      <Pencil size={15} aria-hidden="true" /> Edit listing
                    </Link>
                    <Button type="button" variant="outline" onClick={() => void toggleStudio(studio)} disabled={busyStudioId === studio.id}>
                      {busyStudioId === studio.id ? <Spinner className="size-4" label="Updating studio visibility" /> : studio.isAvailable ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                      {busyStudioId === studio.id ? "Saving…" : studio.isAvailable ? "Hide listing" : "Show listing"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>

      <section aria-labelledby="admin-bookings-heading">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Activity</p>
          <h2 id="admin-bookings-heading" className="mt-2 font-serif text-3xl text-ink">Booking requests</h2>
        </div>
        {loading ? <Card><CardContent className="p-6 text-sm text-muted">Loading booking activity…</CardContent></Card> : null}
        {!loading && overview && overview.bookings.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted">No booking requests yet.</CardContent></Card> : null}
        {!loading && overview && overview.bookings.length > 0 ? (
          <div className="grid gap-3">
            {overview.bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <h3 className="font-semibold text-ink">{booking.studioTitle}</h3>
                    <p className="mt-1 text-sm text-muted">{booking.studioLocation} · {booking.bookingDate} · {booking.startTime}–{booking.endTime}</p>
                    <p className="mt-1 text-sm text-muted">{booking.numberOfPeople} people · ${booking.totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor={`booking-status-${booking.id}`} className="sr-only">Status for {booking.studioTitle} booking</label>
                    <select
                      id={`booking-status-${booking.id}`}
                      value={bookingStatusDrafts[booking.id] ?? booking.status}
                      onChange={(event) => setBookingStatusDrafts((current) => ({ ...current, [booking.id]: event.target.value as BookingStatus }))}
                      className="min-h-10 rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/10"
                    >
                      {(["Pending", "Confirmed", "Completed", "Cancelled", "Declined"] satisfies BookingStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    {(bookingStatusDrafts[booking.id] ?? booking.status) !== booking.status ? (
                      <Button type="button" size="sm" onClick={() => void saveBookingStatus(booking)} disabled={savingBookingId === booking.id}>
                        {savingBookingId === booking.id ? <Spinner className="size-4" label="Saving booking status" /> : null}
                        {savingBookingId === booking.id ? "Saving…" : "Save"}
                      </Button>
                    ) : null}
                    <span className="text-xs text-muted">Requested {displayDate(booking.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
