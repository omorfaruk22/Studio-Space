import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, MapPin, ShieldCheck, Star, UsersRound } from "lucide-react";
import { BookingNoticeButton } from "@/components/studios/booking-notice-button";
import { StudioGallery } from "@/components/studios/studio-gallery";
import { SectionHeading } from "@/components/ui/section-heading";
import type { FeaturedStudio } from "@/lib/studio-types";
import { studioCategoryLabels } from "@/lib/studio-types";

type StudioDetails = FeaturedStudio & {
  images: string[];
  securityDeposit: number;
  maxCapacity: number;
  amenities: string[];
  overview: string;
  host: { name: string };
};

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

function MessagePage({ title, description, href, linkLabel }: { title: string; description: string; href: string; linkLabel: string }) {
  return <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center px-5 py-24 text-center sm:px-8"><div className="max-w-lg rounded-[2rem] border border-line bg-white p-8 shadow-card sm:p-12"><h1 className="font-serif text-3xl tracking-tight text-ink">{title}</h1><p className="mt-3 text-sm leading-6 text-muted">{description}</p><Link href={href} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-white transition hover:bg-forest-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><ArrowLeft size={16} aria-hidden="true" />{linkLabel}</Link></div></main>;
}

function StudioContent({ studio }: { studio: StudioDetails }) {
  const gallery = [studio.image, ...studio.images];
  const category = studioCategoryLabels[studio.category] ?? "Creative space";

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-8 sm:px-8 sm:py-10 xl:px-12">
      <Link href="/studios" className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><ArrowLeft size={16} aria-hidden="true" />Back to all studios</Link>
      <StudioGallery title={studio.title} images={gallery} />

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-forest">{category}</span>
            {studio.rating > 0 ? <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink"><Star size={15} className="fill-[#d89d49] text-[#d89d49]" aria-hidden="true" />{studio.rating.toFixed(1)} rating</span> : <span className="text-sm text-muted">New listing</span>}
          </div>
          <h1 className="mt-4 font-serif text-3xl leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">{studio.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted sm:text-base"><MapPin size={17} aria-hidden="true" />{studio.location}</p>

          <section className="mt-9 border-b border-line pb-8" aria-label="About this space">
            <SectionHeading title="About this space" />
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted sm:text-base">{studio.overview}</p>
          </section>

          <section className="border-b border-line py-8" aria-label="Amenities">
            <SectionHeading title="What this space offers" />
            {studio.amenities.length > 0 ? <ul className="mt-5 grid gap-3 sm:grid-cols-2">{studio.amenities.map((amenity) => <li key={amenity} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-ink"><span className="grid size-7 place-items-center rounded-full bg-sage text-forest"><Check size={15} aria-hidden="true" /></span>{amenity}</li>)}</ul> : <p className="mt-4 text-sm leading-6 text-muted">The host has not added amenities yet.</p>}
          </section>

          <section className="border-b border-line py-8" aria-label="Host details">
            <SectionHeading title="Meet your host" />
            <div className="mt-5 flex items-center gap-4 rounded-3xl border border-line bg-white p-5">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-forest font-serif text-xl text-white">{studio.host.name.trim().charAt(0).toUpperCase()}</span>
              <div><p className="font-semibold text-ink">{studio.host.name}</p><p className="mt-1 text-sm text-muted">StudioSpace host</p></div>
              <ShieldCheck className="ml-auto text-brand-strong" size={22} aria-label="Host profile" />
            </div>
          </section>

          <section className="py-8" aria-label="Guest reviews">
            <SectionHeading title="Guest reviews" />
            <div className="mt-5 rounded-3xl border border-dashed border-line bg-white/70 p-6">
              {studio.rating > 0 ? <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><Star size={16} className="fill-[#d89d49] text-[#d89d49]" aria-hidden="true" />Rated {studio.rating.toFixed(1)} out of 5</p> : <p className="font-serif text-xl text-ink">No reviews yet</p>}
              <p className="mt-2 text-sm leading-6 text-muted">Reviews will appear here as creators share their experience with this space.</p>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-7">
            <p className="text-sm text-muted">Starting at</p>
            <p className="mt-1 font-serif text-3xl text-ink">${studio.hourlyRate}<span className="font-sans text-sm font-normal text-muted"> / hour</span></p>
            <div className="my-5 space-y-4 border-y border-line py-5 text-sm">
              <p className="flex items-center justify-between gap-3"><span className="text-muted">Security deposit</span><span className="font-semibold text-ink">{studio.securityDeposit > 0 ? `$${studio.securityDeposit}` : "None"}</span></p>
              <p className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-muted"><UsersRound size={15} aria-hidden="true" />Capacity</span><span className="font-semibold text-ink">Up to {studio.maxCapacity}</span></p>
              <p className="flex items-center justify-between gap-3"><span className="text-muted">Location</span><span className="max-w-40 text-right font-semibold text-ink">{studio.location}</span></p>
            </div>
            <BookingNoticeButton />
            <p className="mt-3 text-center text-xs leading-5 text-muted">No payment is due now. Online reservations are coming soon.</p>
          </div>
          <Link href="/studios" className="mt-4 inline-flex min-h-10 items-center gap-2 px-2 text-sm font-semibold text-brand-strong hover:underline">Explore more spaces <ArrowRight size={15} aria-hidden="true" /></Link>
        </aside>
      </div>
    </main>
  );
}

export default async function StudioDetailsPage({ params }: PageProps<"/studios/[id]">) {
  const { id } = await params;
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/studios/${encodeURIComponent(id)}`, { cache: "no-store" });
  } catch {
    return <MessagePage title="Studio details are unavailable." description="We couldn’t reach the studio service. Please try again in a moment." href={`/studios/${encodeURIComponent(id)}`} linkLabel="Try again" />;
  }

  if (response.status === 400 || response.status === 404) {
    return <MessagePage title="We couldn’t find that studio." description="It may have been removed or the link may be incorrect. Browse the available spaces instead." href="/studios" linkLabel="Explore studios" />;
  }
  if (!response.ok) {
    return <MessagePage title="Studio details are unavailable." description="Please try again in a moment or return to the studio collection." href="/studios" linkLabel="Explore studios" />;
  }

  const result = await response.json() as { studio: StudioDetails };
  return <StudioContent studio={result.studio} />;
}
