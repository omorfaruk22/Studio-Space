import Image from "next/image";
import Link from "next/link";
import { Aperture, ArrowRight, MapPin, Star } from "lucide-react";
import type { FeaturedStudio } from "@/lib/studio-types";
import { studioCategoryLabels, studioCategoryToneClasses } from "@/lib/studio-types";
import { FavoriteButton } from "@/components/studios/favorite-button";

export function StudioCard({ studio }: { studio: FeaturedStudio }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-line bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-dialog">
      <div className="relative aspect-[1.36] overflow-hidden bg-sage">
        <Link href={`/studios/${studio.id}`} aria-label={`View ${studio.title}`} className="absolute inset-0 block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
          {studio.image ? (
            <Image src={studio.image} alt={studio.title} fill sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw" unoptimized className="object-cover transition duration-500 group-hover:scale-[1.04]" />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#dce8d8,#eeeae0)] text-forest"><Aperture size={58} strokeWidth={1} aria-hidden="true" /></div>
          )}
        </Link>
        <span className={`pointer-events-none absolute left-4 top-4 z-10 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-card ${studioCategoryToneClasses[studio.category]}`}>{studioCategoryLabels[studio.category] ?? "Creative space"}</span>
        <span className="pointer-events-none absolute right-[4.25rem] top-4 z-10 inline-flex items-center gap-1 rounded-full bg-accent-yellow-soft px-2.5 py-1.5 text-xs font-semibold text-accent-yellow-strong shadow-card">{studio.rating > 0 ? <><Star size={13} className="fill-accent-yellow text-accent-yellow" aria-hidden="true" />{studio.rating.toFixed(1)}</> : "New"}</span>
        <FavoriteButton studioId={studio.id} studioTitle={studio.title} />
      </div>
      <Link href={`/studios/${studio.id}`} className="block p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-serif text-xl tracking-tight text-ink sm:text-[1.35rem]">{studio.title}</h3>
          <span className="shrink-0 text-sm font-bold text-ink">${studio.hourlyRate}<span className="font-normal text-muted"> / hr</span></span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><MapPin size={15} aria-hidden="true" /><span className="line-clamp-1">{studio.location}</span></p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-strong">View details <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
      </Link>
    </article>
  );
}
