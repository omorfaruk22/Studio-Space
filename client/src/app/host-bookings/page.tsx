import { redirect } from "next/navigation";
import { HostBookingRequests } from "@/components/bookings/host-booking-requests";
import { getCurrentSession } from "@/lib/server-session";

export default async function HostBookingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/host-bookings");

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Host workspace</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">Booking requests</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Review requests for your studios. Confirming a request reserves its time and prevents another confirmed booking from overlapping.</p>
      <HostBookingRequests />
    </main>
  );
}
