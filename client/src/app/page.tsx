import Link from "next/link";
import {
  Aperture,
  ArrowRight,
  AudioLines,
  BadgeCheck,
  CalendarDays,
  Camera,
  Check,
  ClipboardCheck,
  Clock3,
  Headphones,
  Mic2,
  Palette,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { FeaturedStudios } from "@/components/home/featured-studios";
import { HeroSlider } from "@/components/home/hero-slider";
import { SectionHeading } from "@/components/ui/section-heading";

const categories = [
  { name: "Photo studios", detail: "Natural light to full production", value: "photo", icon: Camera, tone: "bg-[#f4e4d8] text-[#9c553e]" },
  { name: "Sound stages", detail: "Room to build your scene", value: "sound-stage", icon: AudioLines, tone: "bg-[#e1e9df] text-[#42684c]" },
  { name: "Podcast rooms", detail: "Find your voice, in the right room", value: "podcast", icon: Mic2, tone: "bg-[#e4e4f1] text-[#55517d]" },
  { name: "Music suites", detail: "Make space for your next track", value: "music", icon: Headphones, tone: "bg-[#f2e7cf] text-[#98723a]" },
  { name: "Art workshops", detail: "Get hands-on and make a mess", value: "art", icon: Palette, tone: "bg-[#f0dfdf] text-[#9a4f5a]" },
];

const bookingSteps = [
  { title: "Discover spaces", detail: "Browse distinctive studios by location, style, and the work you have in mind.", icon: Aperture },
  { title: "Choose your hours", detail: "Find a time that works for your crew and plan your session with confidence.", icon: Clock3 },
  { title: "Book your space", detail: "Connect with a host, confirm the details, and get ready to create.", icon: BadgeCheck },
  { title: "Make something", detail: "Show up, settle in, and put your best work into the world.", icon: Sparkles },
];

const hostBenefits = [
  { title: "Compare the details", detail: "Review each listing’s rate, capacity, location, and stated amenities before you request a booking.", icon: ClipboardCheck },
  { title: "The host confirms", detail: "A request stays pending until the host confirms it. StudioSpace does not collect payment.", icon: CalendarDays },
  { title: "Plan for your session", detail: "Read the equipment and access details, then confirm anything important with the host before you book.", icon: BadgeCheck },
];

export default function Home() {
  return (
    <main>
      <HeroSlider />

      <section className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-20 xl:px-12" aria-label="Featured studios">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <SectionHeading eyebrow="Spaces worth a closer look" title="Featured studios" description="A few inspiring places to start planning your next project." />
          <Link href="/studios" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:self-auto">
            Explore all studios <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8"><FeaturedStudios /></div>
      </section>

      <section className="border-y border-line/70 bg-white/65" aria-label="Browse studios by category">
        <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-20 xl:px-12">
          <SectionHeading eyebrow="Find your kind of space" title="Made for the way you create." description="From first ideas to final takes, find a space that fits the work." />
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map(({ name, detail, value, icon: Icon, tone }) => (
              <Link key={value} href={`/studios?category=${value}`} className="group rounded-3xl border border-line bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                <span className={`grid size-12 place-items-center rounded-2xl ${tone}`}><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span>
                <span className="mt-6 block font-serif text-xl tracking-tight text-ink">{name}</span>
                <span className="mt-2 block min-h-10 text-sm leading-5 text-muted">{detail}</span>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong">Browse spaces <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-20 xl:px-12">
        <SectionHeading eyebrow="A simple way to make it happen" title="From looking around to lights on." description="Booking the right creative space should feel as considered as the work you make there." align="center" />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bookingSteps.map(({ title, detail, icon: Icon }, index) => (
            <li key={title} className="relative rounded-3xl border border-line bg-white p-6 shadow-card">
              <div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-sage text-forest"><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span><span className="font-serif text-3xl text-ink/15">0{index + 1}</span></div>
              <h3 className="mt-6 font-serif text-xl text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="about" className="mx-auto max-w-page px-5 pb-16 sm:px-8 sm:pb-20 xl:px-12" aria-labelledby="support-heading">
        <div className="grid overflow-hidden rounded-[2rem] bg-forest text-white lg:grid-cols-[1.05fr_0.95fr]">
          <div className="px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#cfe5d2]">Good work starts with clear details</p>
            <h2 id="support-heading" className="mt-4 max-w-xl font-serif text-3xl leading-tight tracking-tight sm:text-4xl">Plan your session with the host.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">StudioSpace connects independent hosts and creators. Review the listing and booking status so both sides can agree on the practical details.</p>
            <ul className="mt-8 space-y-4">
              {hostBenefits.map(({ title, detail, icon: Icon }) => (
                <li key={title} className="flex gap-3"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#cfe5d2]"><Icon size={18} aria-hidden="true" /></span><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-sm leading-5 text-white/65">{detail}</span></span></li>
              ))}
            </ul>
            <Link href="/register" className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Join the community <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="relative hidden min-h-[460px] overflow-hidden lg:block">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#204d38_0%,transparent_35%),linear-gradient(0deg,rgba(23,61,44,.25),rgba(23,61,44,.05)),url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center" role="img" aria-label="A bright, welcoming creative studio workspace" />
            <div className="absolute bottom-9 left-8 right-8 rounded-2xl border border-white/15 bg-forest/65 p-5 text-white backdrop-blur-md xl:left-12 xl:right-12">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#cfe5d2]"><UsersRound size={15} aria-hidden="true" /> Made for good collaboration</div>
              <p className="mt-2 font-serif text-2xl">Space to make it yours.</p>
            </div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-muted sm:text-sm">
          {["Thoughtful creative spaces", "Direct host connections", "A community that cares"].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check size={15} className="text-brand-strong" aria-hidden="true" />{item}</span>)}
        </div>
      </section>
    </main>
  );
}
