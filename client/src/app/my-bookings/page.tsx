import { redirect } from "next/navigation";
import { MyBookingsList } from "@/components/bookings/my-bookings-list";
import { getCurrentSession } from "@/lib/server-session";

export default async function MyBookingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/my-bookings");

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Your reservations</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">My bookings</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Review your studio requests, keep track of their status, and cancel requests that are still pending.</p>
      <MyBookingsList />
    </main>
  );
}
