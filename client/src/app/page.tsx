import Link from "next/link";
import { ArrowDownRight, ArrowRight, Aperture, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

const principles = [
  { title: "Spaces with character", detail: "Independent studios made for the way you create." },
  { title: "Room for your process", detail: "Find a setup that fits your crew, craft, and schedule." },
  { title: "Hosts who get it", detail: "Connect directly with people who know their spaces best." },
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-page px-5 pb-16 pt-7 sm:px-8 sm:pb-20 sm:pt-10 xl:px-12">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-forest px-6 py-12 text-white sm:px-10 sm:py-16 lg:min-h-[490px] lg:px-16 lg:py-20">
          <div aria-hidden="true" className="absolute -right-24 -top-32 -z-10 size-[390px] rounded-full border border-white/10 sm:right-0 sm:size-[520px]" />
          <div aria-hidden="true" className="absolute right-8 top-1/2 -z-10 hidden size-80 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 lg:flex">
            <span className="grid size-56 place-items-center rounded-full border border-white/15 bg-white/[0.04]">
              <Aperture size={142} strokeWidth={0.7} className="text-[#eab99d]" />
            </span>
          </div>
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
              <span className="size-1.5 rounded-full bg-[#e8a27f]" aria-hidden="true" /> Creative spaces, thoughtfully found
            </p>
            <h1 className="mt-7 max-w-2xl font-serif text-5xl leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Make room for what you <em className="font-normal text-[#efb99a]">make.</em>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/72 sm:text-lg sm:leading-8">
              Find a studio that fits your next shoot, sound session, or big idea. Good work starts with the right space.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/studios" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Explore studios <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/add-studio" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Host your space <ArrowDownRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-white/65 sm:text-sm">
              {["Built for independent creators", "Book spaces by the hour"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2"><Check size={15} className="text-[#eab99d]" aria-hidden="true" />{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-page px-5 pb-20 sm:px-8 sm:pb-24 xl:px-12">
        <SectionHeading
          eyebrow="The StudioSpace approach"
          title="A better place to begin your next project."
          description="From the first idea to the final take, the space around you can make all the difference."
        />
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {principles.map((principle, index) => (
            <Card key={principle.title} className="group overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-dialog">
              <CardContent className="p-6 sm:p-7">
                <span className="grid size-11 place-items-center rounded-2xl bg-sand font-serif text-lg text-brand-strong transition group-hover:bg-brand group-hover:text-white" aria-hidden="true">0{index + 1}</span>
                <h2 className="mt-6 font-serif text-2xl tracking-tight text-ink">{principle.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{principle.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
