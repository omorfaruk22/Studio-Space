"use client";

import { useState, type FormEvent } from "react";
import { Aperture, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { popularCategories, primaryNavigation, siteName } from "@/lib/site-config";
import { Input } from "@/components/ui/input";

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/", mark: "◎" },
  { label: "LinkedIn", href: "https://www.linkedin.com/", mark: "in" },
] as const;

export function SiteFooter() {
  const [submitting, setSubmitting] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSubmitting(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: values.get("email"), website: values.get("website") }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not save your interest.");
      toast.success(result.message || "Thanks for joining the StudioSpace updates list.");
      form.reset();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not connect to StudioSpace.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer id="site-footer" className="mt-auto bg-forest text-white">
      <div className="mx-auto max-w-page px-5 pb-8 pt-14 sm:px-8 sm:pt-16 xl:px-12">
        <div className="grid gap-12 border-b border-white/15 pb-12 md:grid-cols-2 xl:grid-cols-[1.3fr_.8fr_.9fr_1.2fr] xl:gap-10">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <span className="grid size-10 place-items-center rounded-full bg-white/10 text-white"><Aperture size={21} aria-hidden="true" /></span>
              <span className="font-serif text-2xl font-semibold tracking-tight">{siteName}</span>
            </Link>
            <p className="mt-5 text-sm leading-6 text-white/70">
              A peer-to-peer home for creative workspaces, production studios, and the people who bring ideas to life.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {socialLinks.map(({ label, href, mark }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-focus">
                  <span aria-hidden="true" className={label === "LinkedIn" ? "text-xs font-bold" : "text-xl leading-none"}>{mark}</span>
                </a>
              ))}
              <a href="https://x.com/" target="_blank" rel="noreferrer" aria-label="X" className="grid size-10 place-items-center rounded-full border border-white/20 text-sm font-bold text-white/80 transition hover:border-white hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-focus">𝕏</a>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Explore</h2>
            <ul className="mt-4 space-y-3">
              {primaryNavigation.map((item) => (
                <li key={item.label}><Link className="text-sm text-white/75 transition hover:text-white" href={item.href}>{item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Popular spaces</h2>
            <ul className="mt-4 space-y-3">
              {popularCategories.map((item) => (
                <li key={item.label}><Link className="text-sm text-white/75 transition hover:text-white" href={item.href}>{item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div className="max-w-sm">
            <h2 className="font-serif text-2xl">Notes for makers</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">Leave your email to register interest in future StudioSpace updates.</p>
            <form onSubmit={subscribe} aria-busy={submitting} className="mt-4 flex gap-2">
              <label htmlFor="footer-email" className="sr-only">Email address for StudioSpace updates</label>
              <Input id="footer-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="Your email address" className="min-w-0 border-white/20 bg-white/10 text-white placeholder:text-white/45 focus:border-white focus:ring-white/20" />
              <label htmlFor="footer-website" className="sr-only">Leave this field blank</label>
              <input id="footer-website" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[10000px] size-px opacity-0" />
              <button type="submit" disabled={submitting} aria-label={submitting ? "Joining updates list" : "Join StudioSpace updates"} className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-wait disabled:opacity-50">
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </form>
            <p className="mt-2 text-xs text-white/45">Your interest is saved in StudioSpace. Email updates are not sent yet.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 StudioSpace. Made for the work you want to make.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
