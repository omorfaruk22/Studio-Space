"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Filter, MapPin, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { StudioCard } from "@/components/studios/studio-card";
import { StudioGridSkeleton } from "@/components/ui/loading";
import type { FeaturedStudio, StudioCategory } from "@/lib/studio-types";
import { studioCategoryLabels } from "@/lib/studio-types";

type StudiosResponse = { studios: FeaturedStudio[] };
type SortOrder = "newest" | "price" | "rating";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const categoryOptions: StudioCategory[] = ["photo", "sound-stage", "podcast", "music", "art"];

async function fetchStudios(signal?: AbortSignal): Promise<FeaturedStudio[]> {
  const response = await fetch(`${apiUrl}/api/studios`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Could not load studios.");
  const result = (await response.json()) as StudiosResponse;
  if (!Array.isArray(result.studios)) throw new Error("The studio response was not valid.");
  return result.studios;
}

export function ExploreStudios({ initialCategory }: { initialCategory: StudioCategory | "all" }) {
  const [studios, setStudios] = useState<FeaturedStudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<StudioCategory | "all">(initialCategory);
  const [location, setLocation] = useState("all");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [minimumCapacity, setMinimumCapacity] = useState("");
  const [amenity, setAmenity] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [mapView, setMapView] = useState(false);

  const loadStudios = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      setStudios(await fetchStudios());
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadInitialStudios() {
      try {
        setStudios(await fetchStudios(controller.signal));
        setHasError(false);
      } catch {
        if (!controller.signal.aborted) setHasError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadInitialStudios();
    return () => controller.abort();
  }, []);

  const locations = useMemo(() => [...new Set(studios.map((studio) => studio.location.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [studios]);
  const filteredStudios = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const filtered = studios.filter((studio) => {
      const price = Number(studio.hourlyRate);
      const minimum = minimumPrice === "" ? 0 : Number(minimumPrice);
      const maximum = maximumPrice === "" ? Number.POSITIVE_INFINITY : Number(maximumPrice);
      const capacity = minimumCapacity === "" ? 0 : Number(minimumCapacity);
      const normalizedAmenity = amenity.trim().toLocaleLowerCase();
      return (category === "all" || studio.category === category)
        && (location === "all" || studio.location === location)
        && studio.title.toLocaleLowerCase().includes(normalizedSearch)
        && price >= minimum
        && price <= maximum
        && studio.maxCapacity >= capacity
        && (!normalizedAmenity || (studio.amenities ?? []).some((item) => item.toLocaleLowerCase().includes(normalizedAmenity)));
    });
    if (sort === "price") filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
    if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
    if (sort === "newest") filtered.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return filtered;
  }, [amenity, category, location, maximumPrice, minimumCapacity, minimumPrice, search, sort, studios]);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setLocation("all");
    setMinimumPrice("");
    setMaximumPrice("");
    setMinimumCapacity("");
    setAmenity("");
    setSort("newest");
  };

  const hasFilters = search !== "" || category !== "all" || location !== "all" || minimumPrice !== "" || maximumPrice !== "" || minimumCapacity !== "" || amenity !== "";

  return (
    <section aria-label="Studio results">
      <div className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <span className="sr-only">Search by studio title</span>
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search studios" className="min-h-12 w-full rounded-2xl border border-line bg-canvas pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/15" />
          </label>
          <label className="block"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value as StudioCategory | "all")} className="min-h-12 w-full rounded-2xl border border-line bg-canvas px-4 text-sm text-ink outline-none focus:border-focus focus:ring-2 focus:ring-focus/15"><option value="all">All categories</option>{categoryOptions.map((value) => <option key={value} value={value}>{studioCategoryLabels[value]}</option>)}</select></label>
          <label className="block"><span className="sr-only">Filter by location</span><select value={location} onChange={(event) => setLocation(event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-canvas px-4 text-sm text-ink outline-none focus:border-focus focus:ring-2 focus:ring-focus/15"><option value="all">All locations</option>{locations.map((place) => <option key={place} value={place}>{place}</option>)}</select></label>
          <label className="block"><span className="sr-only">Minimum hourly price</span><span className="relative block"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">$</span><input type="number" min="0" value={minimumPrice} onChange={(event) => setMinimumPrice(event.target.value)} placeholder="Min / hr" className="min-h-12 w-full rounded-2xl border border-line bg-canvas pl-8 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/15" /></span></label>
          <label className="block"><span className="sr-only">Maximum hourly price</span><span className="relative block"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">$</span><input type="number" min="0" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} placeholder="Max / hr" className="min-h-12 w-full rounded-2xl border border-line bg-canvas pl-8 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/15" /></span></label>
          <label className="block"><span className="sr-only">Minimum studio capacity</span><input type="number" min="1" value={minimumCapacity} onChange={(event) => setMinimumCapacity(event.target.value)} placeholder="Min. capacity" className="min-h-12 w-full rounded-2xl border border-line bg-canvas px-4 text-sm text-ink outline-none placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/15" /></label>
          <label className="block"><span className="sr-only">Filter by amenity</span><input value={amenity} onChange={(event) => setAmenity(event.target.value)} placeholder="Amenity, e.g. Wi-Fi" className="min-h-12 w-full rounded-2xl border border-line bg-canvas px-4 text-sm text-ink outline-none placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/15" /></label>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2 text-sm text-muted"><Filter size={15} aria-hidden="true" /><span>{loading ? "Loading spaces…" : `${filteredStudios.length} ${filteredStudios.length === 1 ? "space" : "spaces"} found`}</span></p>
          <div className="flex flex-wrap items-center gap-2">
            {hasFilters ? <button type="button" onClick={clearFilters} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted transition hover:bg-sand hover:text-ink"><X size={14} aria-hidden="true" />Clear filters</button> : null}
            <button type="button" onClick={() => setMapView((value) => !value)} aria-pressed={mapView} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-canvas px-3 text-xs font-semibold text-ink hover:bg-sand"><MapPin size={14} aria-hidden="true" />{mapView ? "List view" : "Map links"}</button>
            <label className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-canvas px-3 text-xs font-semibold text-ink"><SlidersHorizontal size={14} aria-hidden="true" /><span>Sort</span><select aria-label="Sort studios" value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} className="bg-transparent pr-1 text-xs font-semibold outline-none"><option value="newest">Newest</option><option value="price">Price: low to high</option><option value="rating">Top rated</option></select></label>
          </div>
        </div>
      </div>

      <div className="mt-7" aria-live="polite" aria-busy={loading}>
        {loading ? <StudioGridSkeleton /> : null}
        {!loading && hasError ? <div className="rounded-3xl border border-line bg-white px-6 py-12 text-center" role="status"><p className="font-serif text-2xl text-ink">We couldn’t load spaces right now.</p><p className="mt-2 text-sm text-muted">Please check your connection and try again.</p><button type="button" onClick={() => void loadStudios()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-white transition hover:bg-forest-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><RefreshCw size={15} aria-hidden="true" />Try again</button></div> : null}
        {!loading && !hasError && mapView && filteredStudios.length > 0 ? <div className="mb-4 rounded-2xl border border-line bg-white p-4 text-sm text-muted">Open a studio location in OpenStreetMap. Search uses the listing location text.</div> : null}
        {!loading && !hasError && filteredStudios.length > 0 ? (mapView
          ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredStudios.map((studio) => <article key={studio.id} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4"><div className="min-w-0"><p className="truncate font-semibold text-ink">{studio.title}</p><p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted"><MapPin size={14} aria-hidden="true" />{studio.location}</p></div><a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${studio.title} ${studio.location}`)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-brand-strong hover:bg-sand"><ExternalLink size={14} aria-hidden="true" />Open map</a></article>)}</div>
          : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredStudios.map((studio) => <StudioCard key={studio.id} studio={studio} />)}</div>) : null}
        {!loading && !hasError && filteredStudios.length === 0 ? <div className="rounded-3xl border border-dashed border-line bg-white/70 px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sage text-forest"><Search size={21} aria-hidden="true" /></span><p className="mt-4 font-serif text-2xl text-ink">No spaces match those filters.</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Try another search or clear your filters to see all available studios.</p><button type="button" onClick={clearFilters} className="mt-5 inline-flex min-h-10 items-center rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink transition hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Clear filters</button></div> : null}
      </div>
    </section>
  );
}
