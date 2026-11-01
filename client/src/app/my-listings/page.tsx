import { redirect } from "next/navigation";
import { HostStudioManager } from "@/components/studios/host-studio-manager";
import { getCurrentSession } from "@/lib/server-session";

export default async function MyListingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/my-listings");

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Host workspace</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">My studio listings</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Update your spaces, publish or hide them from search, and remove listings you no longer need.</p>
      <HostStudioManager />
    </main>
  );
}
