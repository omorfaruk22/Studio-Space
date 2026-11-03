"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Eye, Pencil, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Spinner, StudioGridSkeleton } from "@/components/ui/loading";
import type { HostStudio } from "@/lib/studio-types";
import { studioCategoryLabels } from "@/lib/studio-types";

type HostStudiosResponse = { studios?: HostStudio[]; message?: string };

async function fetchHostStudios(): Promise<HostStudio[]> {
  const response = await fetch("/api/host/studios", { cache: "no-store", credentials: "same-origin" });
  const result = (await response.json()) as HostStudiosResponse;
  if (!response.ok || !Array.isArray(result.studios)) {
    throw new Error(result.message || "Could not load your studio listings.");
  }
  return result.studios;
}

export function HostStudioManager() {
  const [studios, setStudios] = useState<HostStudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<HostStudio | null>(null);

  const loadStudios = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStudios(await fetchHostStudios());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your studio listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchHostStudios()
      .then((listings) => { if (active) setStudios(listings); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your studio listings.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function setAvailability(studio: HostStudio) {
    setBusyId(studio.id);
    try {
      const response = await fetch(`/api/host/studios/${studio.id}/availability`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ isAvailable: !studio.isAvailable }),
      });
      const result = (await response.json()) as { studio?: HostStudio; message?: string };
      if (!response.ok || !result.studio) throw new Error(result.message || "Could not update this listing.");
      setStudios((current) => current.map((item) => item.id === studio.id ? result.studio! : item));
      toast.success(result.studio.isAvailable
        ? result.studio.moderationStatus === "approved" ? "Studio listing is live." : "Availability saved. The listing will appear after admin approval."
        : "Studio listing is hidden from search.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update this listing.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteStudio() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const response = await fetch(`/api/host/studios/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not delete this listing.");
      setStudios((current) => current.filter((item) => item.id !== deleteTarget.id));
      toast.success("Studio listing deleted.");
      setDeleteTarget(null);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not delete this listing.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="mt-12" aria-labelledby="your-listings-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Host tools</p>
          <h2 id="your-listings-heading" className="mt-2 font-serif text-3xl tracking-tight text-ink">Your studio listings</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Create, update, and control which spaces appear in search.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/my-listings" className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink transition hover:bg-sand">My listings</Link>
          <Link href="/add-studio" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><Plus size={17} aria-hidden="true" /> Add studio</Link>
        </div>
      </div>

      <div className="mt-5" aria-live="polite" aria-busy={loading || Boolean(busyId)}>
        {loading ? <StudioGridSkeleton count={4} label="Loading your studio listings" className="lg:grid-cols-2" /> : null}
        {!loading && error ? <div className="rounded-2xl border border-line bg-white px-5 py-8 text-center"><p className="text-sm text-muted" role="alert">{error}</p><button type="button" onClick={() => void loadStudios()} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-strong"><RefreshCw size={15} aria-hidden="true" />Try again</button></div> : null}
        {!loading && !error && studios.length === 0 ? <Card><CardContent className="px-6 py-9 text-center sm:py-12"><p className="font-serif text-2xl text-ink">Your first space starts here.</p><p className="mt-2 text-sm text-muted">Create a listing to help creators find your studio.</p><Link href="/add-studio" className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong">Create a listing <ArrowRight size={15} aria-hidden="true" /></Link></CardContent></Card> : null}
        {!loading && !error && studios.length > 0 ? <div className="grid gap-4 lg:grid-cols-2">{studios.map((studio) => (
          <Card key={studio.id}>
            <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-serif text-xl text-ink">{studio.title}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${studio.moderationStatus === "pending" ? "bg-accent-yellow-soft text-accent-yellow-strong" : studio.moderationStatus === "rejected" ? "bg-red-50 text-red-800" : studio.isAvailable ? "bg-accent-green-soft text-accent-green-strong" : "bg-sand text-muted"}`}>{studio.moderationStatus === "pending" ? "Pending review" : studio.moderationStatus === "rejected" ? "Changes requested" : studio.isAvailable ? "Live" : "Hidden"}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{studioCategoryLabels[studio.category]} · {studio.location}</p>
                <p className="mt-1 text-sm font-semibold text-ink">${studio.hourlyRate} / hour</p>
                {studio.moderationStatus === "pending" ? <p className="mt-2 text-xs leading-5 text-muted">This listing is private while an admin reviews it.</p> : null}
                {studio.moderationStatus === "rejected" && studio.moderationNote ? <p className="mt-2 text-xs leading-5 text-red-800">Admin note: {studio.moderationNote}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {studio.isAvailable && studio.moderationStatus === "approved" ? <Link href={`/studios/${studio.id}`} aria-label={`View ${studio.title}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3.5 text-sm font-semibold text-ink hover:bg-sand"><Eye size={15} aria-hidden="true" /> View</Link> : null}
                <Link href={`/studios/edit/${studio.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3.5 text-sm font-semibold text-ink hover:bg-sand"><Pencil size={15} aria-hidden="true" /> Edit</Link>
                <button type="button" onClick={() => void setAvailability(studio)} disabled={busyId === studio.id} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3.5 text-sm font-semibold text-muted hover:bg-sand disabled:cursor-wait disabled:opacity-50">{busyId === studio.id ? <Spinner className="size-4" label="Updating listing" /> : null}{busyId === studio.id ? "Saving…" : studio.isAvailable ? "Hide" : "Publish"}</button>
                <button type="button" onClick={() => setDeleteTarget(studio)} disabled={busyId === studio.id} className="inline-flex min-h-10 items-center rounded-full border border-red-200 px-3.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
              </div>
            </CardContent>
          </Card>
        ))}</div> : null}
      </div>
      <Dialog
        open={Boolean(deleteTarget)}
        title="Delete this studio listing?"
        description="This permanently removes the listing. You cannot restore it after deletion."
        onClose={() => setDeleteTarget(null)}
      >
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setDeleteTarget(null)} disabled={Boolean(deleteTarget && busyId === deleteTarget.id)} className="min-h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink hover:bg-sand disabled:cursor-wait disabled:opacity-50">Keep listing</button>
          <button type="button" onClick={() => void deleteStudio()} disabled={!deleteTarget || busyId === deleteTarget.id} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-50">{deleteTarget && busyId === deleteTarget.id ? <Spinner className="size-4" label="Deleting studio listing" /> : null}{deleteTarget && busyId === deleteTarget.id ? "Deleting…" : "Delete permanently"}</button>
        </div>
      </Dialog>
    </section>
  );
}
