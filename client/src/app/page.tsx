export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 text-stone-950">
      <section className="w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          StudioSpace · Project setup
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          A workspace for creative work.
        </h1>
        <p className="mt-5 max-w-xl leading-7 text-stone-600">
          The Next.js frontend is ready. Studio discovery, booking, and the full
          marketplace experience will be built in the upcoming project phases.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
          Frontend development server is ready
        </div>
      </section>
    </main>
  );
}
