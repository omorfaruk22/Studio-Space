import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | StudioSpace",
  description: "What information the current StudioSpace project stores and uses.",
};

const sections = [
  {
    title: "Account and sign-in information",
    body: "When you register or sign in, StudioSpace processes your name, email address, optional profile photo, and authentication session. Google sign-in shares the basic profile details required for the sign-in flow. Passwords are handled by Better Auth and are not shown to hosts.",
  },
  {
    title: "Listings and bookings",
    body: "Studio listings and booking requests are stored in MongoDB Atlas. A listing displays the host name and space information needed for discovery. Booking records include the selected date and time, guest count, price summary, status, and the contact phone number a guest provides. That phone number and the account contact details needed to coordinate a request are shared with the listing host. When checkout is configured, SSLCommerz handles the hosted payment page; StudioSpace stores the transaction reference and payment status, not card numbers or bank credentials. The checkout currently charges the rental amount; a displayed security deposit is separate.",
  },
  {
    title: "Saved spaces, images, and updates list",
    body: "Saved studios are associated with your account. If image uploads are enabled, uploaded studio images are hosted by ImgBB. Host verification requests store the business details, website, and explanation the host submits for manual review; the form does not request identity-document uploads. The footer updates form stores the email address you submit in MongoDB; newsletter campaigns are not connected. Booking and moderation emails are sent through SMTP only after the service owner configures an email provider.",
  },
  {
    title: "Browser storage and your choices",
    body: "The selected light or dark theme is stored in your browser's local storage. Authentication uses secure, HTTP-only cookies in production. This project does not currently provide a self-service account deletion or data export screen.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-12 sm:px-8 sm:py-16 xl:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">StudioSpace</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">Privacy notes</h1>
        <p className="mt-4 text-sm leading-6 text-muted">This page describes data handling in the current project build. It is not a complete privacy notice for a commercial service.</p>
        <div className="mt-9 space-y-4">
          {sections.map(({ title, body }) => (
            <section key={title} className="rounded-3xl border border-line bg-white p-6 sm:p-7">
              <h2 className="font-serif text-2xl text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
            </section>
          ))}
        </div>
        <p className="mt-7 text-sm leading-6 text-muted">For questions about this project’s data, contact the project owner through a private channel. Do not post account details or sensitive personal information in a public issue.</p>
        <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition hover:bg-forest-strong">Return to StudioSpace</Link>
      </div>
    </main>
  );
}
