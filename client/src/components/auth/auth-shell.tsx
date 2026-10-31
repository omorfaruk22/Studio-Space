import type { ReactNode } from "react";
import Link from "next/link";
import { Aperture } from "lucide-react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-white shadow-card lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-forest p-10 text-white lg:flex">
          <div aria-hidden="true" className="absolute -right-20 -top-20 size-80 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-40 -left-36 size-[27rem] rounded-full border border-white/10" />
          <Link href="/" className="relative inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="grid size-11 place-items-center rounded-full bg-white/10"><Aperture size={24} aria-hidden="true" /></span>
            <span className="font-serif text-2xl font-semibold tracking-tight">StudioSpace</span>
          </Link>
          <div className="relative max-w-sm pb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">A little room for big ideas</p>
            <p className="mt-5 font-serif text-4xl leading-tight">Find the space where your next thing takes shape.</p>
            <p className="mt-5 text-sm leading-6 text-white/70">Connect with independent studios and the creators who make them special.</p>
          </div>
        </aside>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-xl text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
              <span className="grid size-10 place-items-center rounded-full bg-forest text-white"><Aperture size={21} aria-hidden="true" /></span>
              <span className="font-serif text-xl font-semibold">StudioSpace</span>
            </Link>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}

export function FormDivider() {
  return (
    <div className="my-6 flex items-center gap-4 text-xs font-medium text-muted">
      <span className="h-px flex-1 bg-line" />
      <span>or continue with</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
