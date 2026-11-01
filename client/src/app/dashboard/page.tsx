import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Aperture } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HostStudioManager } from "@/components/studios/host-studio-manager";
import { getCurrentSession } from "@/lib/server-session";

export default async function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-page flex-1 px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <Suspense fallback={<p className="py-16 text-sm text-muted">Checking your account…</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/dashboard");

  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Your StudioSpace</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">Welcome, {session.user.name}.</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">You are signed in as {session.user.email}. Your account session was checked on the server.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-start gap-4 p-6 sm:p-7">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sand text-brand-strong"><Aperture size={23} aria-hidden="true" /></span>
            <div>
              <h2 className="font-serif text-2xl text-ink">Host a creative space</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Share a studio or production space with independent creators.</p>
              <Link href="/add-studio" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-strong hover:underline">Add a studio <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 sm:p-7">
            <h2 className="font-serif text-2xl text-ink">Account details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-muted">Name</dt><dd className="mt-1 font-medium text-ink">{session.user.name}</dd></div>
              <div><dt className="text-muted">Email</dt><dd className="mt-1 font-medium text-ink">{session.user.email}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </div>
      <HostStudioManager />
    </>
  );
}
