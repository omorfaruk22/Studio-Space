"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/loading";

type RouteErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: RouteErrorProps) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    toast.error("This page hit a problem. You can try loading it again.");
  }, [error]);

  function handleRetry() {
    setRetrying(true);
    retry();
  }

  return (
    <main role="alert" className="mx-auto flex w-full max-w-page flex-1 items-center justify-center px-5 py-16 sm:px-8">
      <section className="w-full max-w-xl rounded-[2rem] border border-line bg-white p-7 text-center shadow-card sm:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-sand text-brand-strong"><TriangleAlert size={25} aria-hidden="true" /></span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-brand-strong">A small interruption</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink sm:text-4xl">We couldn’t load this page.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Your work is safe. Try again, or head back to StudioSpace and continue exploring.</p>
        {error.digest ? <p className="mt-3 text-xs text-muted">Reference: {error.digest}</p> : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={handleRetry} disabled={retrying} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-white transition hover:bg-forest-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60">
            {retrying ? <Spinner className="size-4" label="Retrying" /> : <RefreshCw size={16} aria-hidden="true" />}
            {retrying ? "Trying again…" : "Try again"}
          </button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink transition hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><ArrowLeft size={16} aria-hidden="true" />Return to Home</Link>
        </div>
      </section>
    </main>
  );
}
