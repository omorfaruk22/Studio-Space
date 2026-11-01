import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SavedStudiosList } from "@/components/studios/saved-studios-list";
import { getCurrentSession } from "@/lib/server-session";

export const metadata: Metadata = {
  title: "Saved studios | StudioSpace",
  description: "Keep a personal list of creative spaces you want to revisit.",
};

export default async function SavedStudiosPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=%2Fsaved-studios");

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Your shortlist</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">Saved studios</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Keep interesting spaces together while you plan your next project.</p>
      <SavedStudiosList />
    </main>
  );
}
