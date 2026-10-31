export default function StudioDetailsLoading() {
  return (
    <main className="mx-auto w-full max-w-page flex-1 animate-pulse px-5 py-8 sm:px-8 sm:py-10 xl:px-12" aria-label="Loading studio details">
      <div className="mb-6 h-10 w-44 rounded-full bg-sand" />
      <div className="aspect-[1.8] rounded-[2rem] bg-sage/70" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5"><div className="h-5 w-40 rounded bg-sand" /><div className="h-12 w-3/4 rounded bg-sand" /><div className="h-5 w-1/2 rounded bg-sand" /><div className="mt-10 h-7 w-52 rounded bg-sand" /><div className="h-24 rounded-2xl bg-sand" /></div>
        <div className="h-72 rounded-3xl bg-sage/70" />
      </div>
    </main>
  );
}
