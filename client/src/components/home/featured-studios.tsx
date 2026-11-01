"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Aperture, ArrowRight, RefreshCw } from "lucide-react";
import type { FeaturedStudio } from "@/lib/studio-types";
import { StudioCard } from "@/components/studios/studio-card";
import { StudioGridSkeleton } from "@/components/ui/loading";

type FeaturedResponse = { studios: FeaturedStudio[] };

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

async function fetchFeaturedStudios(signal?: AbortSignal): Promise<FeaturedStudio[]> {
  const response = await fetch(`${apiUrl}/api/studios/featured`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Could not load featured studios.");
  const result = (await response.json()) as FeaturedResponse;
  return Array.isArray(result.studios) ? result.studios.slice(0, 6) : [];
}

export function FeaturedStudios() {
  const [studios, setStudios] = useState<FeaturedStudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStudios = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setStudios(await fetchFeaturedStudios());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadInitialStudios() {
      try {
        setStudios(await fetchFeaturedStudios(controller.signal));
        setError(false);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadInitialStudios();
    return () => controller.abort();
  }, []);

  if (loading) {
    return <StudioGridSkeleton label="Loading featured studios" />;
  }

  if (error) {
    return <div className="rounded-3xl border border-line bg-white px-6 py-10 text-center" role="status"><p className="font-serif text-xl text-ink">We couldn’t load the studios just now.</p><p className="mt-2 text-sm text-muted">Check your connection and try again.</p><button type="button" onClick={() => void loadStudios()} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-white transition hover:bg-forest-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><RefreshCw size={15} aria-hidden="true" />Try again</button></div>;
  }

  if (studios.length === 0) {
    return <div className="rounded-3xl border border-dashed border-line bg-white/70 px-6 py-10 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sage text-forest"><Aperture size={23} aria-hidden="true" /></span><p className="mt-4 font-serif text-xl text-ink">The next great space belongs here.</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Featured studios will appear here as hosts list their creative spaces.</p><Link href="/add-studio" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Host your space <ArrowRight size={15} aria-hidden="true" /></Link></div>;
  }

  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite" aria-busy={loading}>{studios.map((studio) => <StudioCard key={studio.id} studio={studio} />)}</div>;
}
