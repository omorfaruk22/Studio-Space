import { redirect } from "next/navigation";
import { StudioForm } from "@/components/studios/studio-form";
import { getCurrentSession } from "@/lib/server-session";

export default async function AddStudioPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/add-studio");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Host a creative space</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">Create your studio listing</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Add the essentials creators need to discover and compare your space. You can update the listing from your dashboard.</p>
      <section className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8">
        <StudioForm hostName={session.user.name} hostEmail={session.user.email} />
      </section>
    </main>
  );
}
