import Link from "next/link";
import { redirect } from "next/navigation";
import { StudioForm } from "@/components/studios/studio-form";
import { getCurrentSession } from "@/lib/server-session";

type AdminStudioEditPageProps = { params: Promise<{ id: string }> };

export default async function AdminStudioEditPage({ params }: AdminStudioEditPageProps) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) redirect(`/login?next=/admin/studios/${encodeURIComponent(id)}/edit`);

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <Link href="/admin" className="text-sm font-semibold text-brand-strong hover:underline">← Back to admin dashboard</Link>
      <h1 className="mt-5 font-serif text-4xl tracking-tight text-ink sm:text-5xl">Edit studio listing</h1>
      <p className="mb-8 mt-3 text-sm text-muted">Update the listing details. Changes are saved to the live studio record.</p>
      <StudioForm studioId={id} adminMode />
    </main>
  );
}
