"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, Pencil, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
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
  moderationStatus: "pending" | "approved" | "rejected";
  moderationNote?: string;
  createdAt?: string;
};

type HostVerificationRequest = {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  website?: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
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
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentStatus?: string;
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
    pendingModerationCount: number;
  };
  studios: AdminStudio[];
  verificationRequests: HostVerificationRequest[];
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
  return { ...result, verificationRequests: result.verificationRequests ?? [] } as AdminOverview;
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
  const [busyVerificationId, setBusyVerificationId] = useState("");
  const [moderationNotes, setModerationNotes] = useState<Record<string, string>>({});
  const [verificationNotes, setVerificationNotes] = useState<Record<string, string>>({});
  const [bookingStatusDrafts, setBookingStatusDrafts] = useState<Record<string, BookingStatus>>({});
  const [savingBookingId, setSavingBookingId] = useState("");
  const [studioSearch, setStudioSearch] = useState("");
  const [studioVisibilityFilter, setStudioVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"all" | BookingStatus>("all");

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
      const wasPublic = studio.isAvailable && studio.moderationStatus === "approved";
      const isPublic = isAvailable && studio.moderationStatus === "approved";
      const publicDelta = Number(isPublic) - Number(wasPublic);
      setOverview((current) => current ? {
        ...current,
        studios: current.studios.map((item) => item.id === studio.id ? { ...item, isAvailable } : item),
        stats: {
          ...current.stats,
          liveStudioCount: current.stats.liveStudioCount + publicDelta,
          hiddenStudioCount: current.stats.hiddenStudioCount - publicDelta,
        },
      } : current);
      toast.success(isAvailable ? "Studio is visible in search." : "Studio is hidden from search.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update this studio.");
    } finally {
      setBusyStudioId("");
    }
  }

  async function moderateStudio(studio: AdminStudio, status: "approved" | "rejected") {
    setBusyStudioId(studio.id);
    try {
      const response = await fetch(`/api/admin/studios/${studio.id}/moderation`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status, note: moderationNotes[studio.id] ?? "" }),
      });
      const result = await response.json() as { studio?: { moderationStatus: AdminStudio["moderationStatus"] }; message?: string };
      if (!response.ok || !result.studio) throw new Error(result.message || "Could not review this listing.");
      const wasPublic = studio.isAvailable && studio.moderationStatus === "approved";
      const isPublic = studio.isAvailable && result.studio.moderationStatus === "approved";
      const publicDelta = Number(isPublic) - Number(wasPublic);
      setOverview((current) => current ? {
        ...current,
        studios: current.studios.map((item) => item.id === studio.id ? { ...item, moderationStatus: result.studio!.moderationStatus, moderationNote: moderationNotes[studio.id] ?? "" } : item),
        stats: {
          ...current.stats,
          pendingModerationCount: Math.max(0, current.stats.pendingModerationCount - Number(studio.moderationStatus === "pending")),
          liveStudioCount: current.stats.liveStudioCount + publicDelta,
          hiddenStudioCount: current.stats.hiddenStudioCount - publicDelta,
        },
      } : current);
      toast.success(status === "approved" ? "Listing approved and available to the public." : "Listing rejected and kept private.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not review this listing.");
    } finally {
      setBusyStudioId("");
    }
  }

  async function reviewHost(request: HostVerificationRequest, status: "approved" | "rejected") {
    setBusyVerificationId(request.id);
    try {
      const response = await fetch(`/api/admin/host-verifications/${request.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status, adminNote: verificationNotes[request.id] ?? "" }),
      });
      const result = await response.json() as { verification?: { status: HostVerificationRequest["status"] }; message?: string };
      if (!response.ok || !result.verification) throw new Error(result.message || "Could not update host verification.");
      setOverview((current) => current ? {
        ...current,
        verificationRequests: current.verificationRequests.map((item) => item.id === request.id ? { ...item, status: result.verification!.status, adminNote: verificationNotes[request.id] ?? "" } : item),
      } : current);
      toast.success(status === "approved" ? "Host verification approved." : "Host verification declined.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update host verification.");
    } finally {
      setBusyVerificationId("");
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
  const normalizedStudioSearch = studioSearch.trim().toLowerCase();
  const filteredStudios = (overview?.studios ?? []).filter((studio) => {
    const matchesSearch = !normalizedStudioSearch || [studio.title, studio.category, studio.location, studio.ownerName, studio.ownerEmail]
      .some((value) => value.toLowerCase().includes(normalizedStudioSearch));
    const matchesVisibility = studioVisibilityFilter === "all"
      || (studioVisibilityFilter === "visible" ? studio.isAvailable : !studio.isAvailable);
    return matchesSearch && matchesVisibility;
  });
  const normalizedBookingSearch = bookingSearch.trim().toLowerCase();
  const filteredBookings = (overview?.bookings ?? []).filter((booking) => {
    const matchesSearch = !normalizedBookingSearch || [booking.studioTitle, booking.studioLocation, booking.bookingDate]
      .some((value) => value.toLowerCase().includes(normalizedBookingSearch));
    return matchesSearch && (bookingStatusFilter === "all" || booking.status === bookingStatusFilter);
  });
  const metrics = [
    { label: "All studios", value: stats?.studioCount ?? 0 },
    { label: "Visible studios", value: stats?.liveStudioCount ?? 0 },
    { label: "Hidden studios", value: stats?.hiddenStudioCount ?? 0 },
    { label: "All bookings", value: stats?.bookingCount ?? 0 },
    { label: "Pending bookings", value: stats?.pendingBookingCount ?? 0 },
    { label: "Confirmed bookings", value: stats?.confirmedBookingCount ?? 0 },
    { label: "Listings awaiting review", value: stats?.pendingModerationCount ?? 0 },
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

      <section aria-labelledby="admin-host-review-heading">
        <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Trust and safety</p><h2 id="admin-host-review-heading" className="mt-2 font-serif text-3xl text-ink">Host verification requests</h2><p className="mt-2 text-sm text-muted">Review the public business details hosts provide. Do not request government ID uploads in this form.</p></div>
        {loading ? <Card><CardContent className="p-6 text-sm text-muted">Loading host requests…</CardContent></Card> : null}
        {!loading && (overview?.verificationRequests.length ?? 0) === 0 ? <Card><CardContent className="p-6 text-sm text-muted">No host verification requests yet.</CardContent></Card> : null}
        {!loading && overview?.verificationRequests.map((request) => (
          <Card key={request.id} className="mb-3"><CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-ink">{request.businessName || request.name}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${request.status === "pending" ? "bg-accent-yellow-soft text-accent-yellow-strong" : request.status === "approved" ? "bg-accent-green-soft text-accent-green-strong" : "bg-red-50 text-red-800"}`}>{request.status}</span></div><p className="mt-1 text-sm text-muted">{request.name} · {request.email}</p>{request.website ? <a href={request.website} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center text-sm text-brand-strong underline">{request.website}</a> : null}<p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink">{request.message}</p><p className="mt-2 text-xs text-muted">Submitted {displayDate(request.createdAt)}</p></div>
              {request.status === "pending" ? <div className="w-full shrink-0 space-y-2 sm:max-w-xs"><label htmlFor={`host-verification-note-${request.id}`} className="sr-only">Optional note to {request.name}</label><Input id={`host-verification-note-${request.id}`} maxLength={500} value={verificationNotes[request.id] ?? ""} onChange={(event) => setVerificationNotes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Optional note (max 500 chars)" /><div className="flex gap-2"><Button type="button" size="sm" onClick={() => void reviewHost(request, "approved")} disabled={busyVerificationId === request.id}>{busyVerificationId === request.id ? <Spinner className="size-4" label="Saving host review" /> : <Check size={15} aria-hidden="true" />}Approve</Button><Button type="button" size="sm" variant="outline" onClick={() => void reviewHost(request, "rejected")} disabled={busyVerificationId === request.id}>{busyVerificationId === request.id ? null : <X size={15} aria-hidden="true" />}Decline</Button></div></div> : request.adminNote ? <p className="text-sm text-muted sm:max-w-xs"><span className="font-semibold">Admin note: </span>{request.adminNote}</p> : null}
            </div>
          </CardContent></Card>
        ))}
      </section>

      <section aria-labelledby="admin-studios-heading">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Moderation</p>
          <h2 id="admin-studios-heading" className="mt-2 font-serif text-3xl text-ink">Studio listings</h2>
        </div>
        {loading ? <Card><CardContent className="p-6 text-sm text-muted">Loading studio listings…</CardContent></Card> : null}
        {!loading && overview && overview.studios.length > 0 ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <Input type="search" aria-label="Search studio listings" value={studioSearch} onChange={(event) => setStudioSearch(event.target.value)} placeholder="Search studio, location, host…" className="pl-11" />
            </div>
            <label className="sr-only" htmlFor="studio-visibility-filter">Filter studio visibility</label>
            <select id="studio-visibility-filter" value={studioVisibilityFilter} onChange={(event) => setStudioVisibilityFilter(event.target.value as "all" | "visible" | "hidden")} className="min-h-12 rounded-2xl border border-line bg-white px-4 text-sm text-ink focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/10">
              <option value="all">All listings</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        ) : null}
        {!loading && overview && overview.studios.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted">No studio listings yet.</CardContent></Card> : null}
        {!loading && overview && overview.studios.length > 0 && filteredStudios.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted">No studio listings match these filters.</CardContent></Card> : null}
        {!loading && overview && filteredStudios.length > 0 ? (
          <div className="grid gap-3">
            {filteredStudios.map((studio) => (
              <Card key={studio.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-xl text-ink">{studio.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${studio.moderationStatus === "pending" ? "bg-accent-yellow-soft text-accent-yellow-strong" : studio.moderationStatus === "rejected" ? "bg-red-50 text-red-800" : studio.isAvailable ? "bg-accent-green-soft text-accent-green-strong" : "bg-sand text-muted"}`}>{studio.moderationStatus === "pending" ? "Pending review" : studio.moderationStatus === "rejected" ? "Rejected" : studio.isAvailable ? "Visible" : "Hidden"}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{studioCategoryLabels[studio.category]} · {studio.location}</p>
                    <p className="mt-1 text-sm text-muted">Host: {studio.ownerName} · {studio.ownerEmail}</p>
                    <p className="mt-1 text-xs text-muted">${studio.hourlyRate} / hour · Added {displayDate(studio.createdAt)}</p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-64">
                    <Link href={`/admin/studios/${studio.id}/edit`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-strong">
                      <Pencil size={15} aria-hidden="true" /> Edit listing
                    </Link>
                    {studio.moderationStatus === "pending" ? <>
                      <label htmlFor={`moderation-note-${studio.id}`} className="sr-only">Optional moderation note for {studio.title}</label>
                      <Input id={`moderation-note-${studio.id}`} maxLength={500} value={moderationNotes[studio.id] ?? ""} onChange={(event) => setModerationNotes((current) => ({ ...current, [studio.id]: event.target.value }))} placeholder="Optional note for the host" />
                      <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => void moderateStudio(studio, "approved")} disabled={busyStudioId === studio.id}>{busyStudioId === studio.id ? <Spinner className="size-4" label="Saving listing review" /> : <Check size={15} aria-hidden="true" />}Approve listing</Button><Button type="button" variant="outline" onClick={() => void moderateStudio(studio, "rejected")} disabled={busyStudioId === studio.id}>{busyStudioId === studio.id ? null : <X size={15} aria-hidden="true" />}Reject</Button></div>
                    </> : null}
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
        {!loading && overview && overview.bookings.length > 0 ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <Input type="search" aria-label="Search booking requests" value={bookingSearch} onChange={(event) => setBookingSearch(event.target.value)} placeholder="Search studio, location, date…" className="pl-11" />
            </div>
            <label className="sr-only" htmlFor="booking-status-filter">Filter booking status</label>
            <select id="booking-status-filter" value={bookingStatusFilter} onChange={(event) => setBookingStatusFilter(event.target.value as "all" | BookingStatus)} className="min-h-12 rounded-2xl border border-line bg-white px-4 text-sm text-ink focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/10">
              <option value="all">All statuses</option>
              {(["Pending", "Confirmed", "Completed", "Cancelled", "Declined"] satisfies BookingStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        ) : null}
        {!loading && overview && overview.bookings.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted">No booking requests yet.</CardContent></Card> : null}
        {!loading && overview && overview.bookings.length > 0 && filteredBookings.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted">No booking requests match these filters.</CardContent></Card> : null}
        {!loading && overview && filteredBookings.length > 0 ? (
          <div className="grid gap-3">
            {filteredBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <h3 className="font-semibold text-ink">{booking.studioTitle}</h3>
                    <p className="mt-1 text-sm text-muted">{booking.studioLocation} · {booking.bookingDate} · {booking.startTime}–{booking.endTime}</p>
                    <p className="mt-1 text-sm text-muted">{booking.numberOfPeople} people · ${booking.totalPrice.toFixed(2)}</p>
                    {booking.customerName || booking.customerEmail || booking.customerPhone ? <p className="mt-1 text-xs leading-5 text-muted">Customer: {booking.customerName || "—"}{booking.customerEmail ? <> · <a className="underline" href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a></> : null}{booking.customerPhone ? <> · <a className="underline" href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a></> : null}</p> : null}
                    <p className="mt-1 text-xs text-muted">Payment: {booking.paymentStatus ?? "unpaid"}</p>
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
