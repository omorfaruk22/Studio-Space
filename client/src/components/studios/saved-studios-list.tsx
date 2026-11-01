"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, RefreshCw } from "lucide-react";
import { StudioCard } from "@/components/studios/studio-card";
import { FavoriteButton } from "@/components/studios/favorite-button";
import { useSavedStudios } from "@/components/studios/saved-studios-provider";
import { Card, CardContent } from "@/components/ui/card";
import { StudioGridSkeleton } from "@/components/ui/loading";
import type { FeaturedStudio } from "@/lib/studio-types";

type SavedStudio = FeaturedStudio & { isAvailable: boolean };
type SavedStudiosResponse = { studios?: SavedStudio[]; message?: string };

async function fetchSavedStudios(): Promise<SavedStudio[]> {
  const response = await fetch("/api/saved-studios", { cache: "no-store", credentials: "same-origin" });
  const result = await response.json() as SavedStudiosResponse;
  if (!response.ok || !Array.isArray(result.studios)) {
    throw new Error(result.message || "Could not load your saved studios.");
  }
  return result.studios;
}

export function SavedStudiosList() {
  const { savedIds, ready } = useSavedStudios();
  const [studios, setStudios] = useState<SavedStudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStudios(await fetchSavedStudios());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your saved studios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchSavedStudios()
      .then((items) => { if (active) setStudios(items); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your saved studios.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleStudios = ready ? studios.filter((studio) => savedIds.has(studio.id)) : studios;
  const available = visibleStudios.filter((studio) => studio.isAvailable);
  const unavailable = visibleStudios.filter((studio) => !studio.isAvailable);

  return (
    <section className="mt-9" aria-label="Saved studios" aria-live="polite" aria-busy={loading}>
      {loading ? <StudioGridSkeleton label="Loading saved studios" /> : null}
      {!loading && error ? <Card><CardContent className="px-6 py-10 text-center"><p className="text-sm text-muted" role="alert">{error}</p><button type="button" onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-strong"><RefreshCw size={15} aria-hidden="true" />Try again</button></CardContent></Card> : null}
      {!loading && !error && visibleStudios.length === 0 ? <Card><CardContent className="px-6 py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sage text-forest"><Heart size={22} aria-hidden="true" /></span><h2 className="mt-4 font-serif text-2xl text-ink">Your saved list is empty</h2><p className="mt-2 text-sm text-muted">Use the heart on a studio card to keep a space for later.</p></CardContent></Card> : null}
      {!loading && !error && available.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{available.map((studio) => <StudioCard key={studio.id} studio={studio} />)}</div> : null}
      {!loading && !error && unavailable.length > 0 ? (
        <div className="mt-9">
          <h2 className="font-serif text-2xl text-ink">Currently unavailable</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {unavailable.map((studio) => (
              <li key={studio.id} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4">
                <div className="min-w-0"><p className="truncate font-semibold text-ink">{studio.title}</p><p className="mt-1 truncate text-sm text-muted">{studio.location}</p></div>
                <div className="relative size-10 shrink-0"><FavoriteButton studioId={studio.id} studioTitle={studio.title} /></div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
