import { Suspense } from "react";
import { Compass } from "lucide-react";
import { ExploreStudios } from "@/components/studios/explore-studios";
import { SectionHeading } from "@/components/ui/section-heading";
import type { StudioCategory } from "@/lib/studio-types";

const categories: StudioCategory[] = ["photo", "sound-stage", "podcast", "music", "art"];

type StudiosPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

async function ExploreFromQuery({ searchParams }: StudiosPageProps) {
  const query = await searchParams;
  const category = typeof query.category === "string" && categories.includes(query.category as StudioCategory)
    ? query.category as StudioCategory
    : "all";

  return <ExploreStudios initialCategory={category} />;
}

function ExploreFallback() {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading studios">{Array.from({ length: 6 }, (_, index) => <div key={index} aria-hidden="true" className="overflow-hidden rounded-3xl border border-line bg-white"><div className="aspect-[1.36] animate-pulse bg-sage/70" /><div className="space-y-3 p-5"><div className="h-5 w-3/4 animate-pulse rounded bg-sand" /><div className="h-4 w-1/2 animate-pulse rounded bg-sand" /></div></div>)}</div>;
}

export default function StudiosPage({ searchParams }: StudiosPageProps) {
  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <div className="mb-10 rounded-[2rem] bg-forest px-6 py-9 text-white sm:px-10 sm:py-12">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#efb99a]"><Compass size={15} aria-hidden="true" />Explore StudioSpace</p>
        <SectionHeading title="Find a space that fits your next idea." description="Search thoughtful studios, compare the details, and find the room your next project needs." className="mt-3 max-w-3xl [&_h2]:text-white [&_p:last-child]:text-white/70" />
      </div>
      <Suspense fallback={<ExploreFallback />}>
        <ExploreFromQuery searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
