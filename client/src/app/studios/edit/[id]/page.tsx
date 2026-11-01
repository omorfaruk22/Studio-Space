import { redirect } from "next/navigation";
import { StudioForm } from "@/components/studios/studio-form";
import { getCurrentSession } from "@/lib/server-session";

type EditStudioPageProps = { params: Promise<{ id: string }> };

export default async function EditStudioPage({ params }: EditStudioPageProps) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/studios/edit");
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Manage your listing</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">Edit studio</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Update the details creators see when they explore your space.</p>
      <section className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8">
        <StudioForm studioId={id} hostName={session.user.name} hostEmail={session.user.email} />
      </section>
    </main>
  );
}
