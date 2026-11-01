import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms | StudioSpace",
  description: "Current usage notes for the StudioSpace creative workspace demo.",
};

const sections = [
  {
    title: "Using StudioSpace",
    body: "StudioSpace helps creators discover independently listed workspaces and send booking requests to their hosts. You must provide accurate account and booking details and use the service lawfully.",
  },
  {
    title: "Listings and booking requests",
    body: "Hosts are responsible for the accuracy of their listing information, rates, amenities, access instructions, and availability. A request is not confirmed until the host changes its status to Confirmed. StudioSpace does not process payments; users must agree directly with the host about any payment or deposit arrangements.",
  },
  {
    title: "Safety and support",
    body: "StudioSpace does not currently verify host identities, inspect equipment, provide liability insurance, or operate a 24/7 support service. Review the space details and confirm safety, equipment, access, and other important requirements with the host before a session.",
  },
  {
    title: "Availability and changes",
    body: "The application is provided as a project demonstration. Features, listings, and availability can change, and the platform does not guarantee that a listed space will remain available or that a booking request will be accepted.",
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-12 sm:px-8 sm:py-16 xl:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">StudioSpace</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">Terms of use</h1>
        <p className="mt-4 text-sm leading-6 text-muted">These notes describe how the current StudioSpace project works. They are not a substitute for a complete commercial marketplace agreement.</p>
        <div className="mt-9 space-y-4">
          {sections.map(({ title, body }) => (
            <section key={title} className="rounded-3xl border border-line bg-white p-6 sm:p-7">
              <h2 className="font-serif text-2xl text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
            </section>
          ))}
        </div>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition hover:bg-forest-strong">Return to StudioSpace</Link>
      </div>
    </main>
  );
}
