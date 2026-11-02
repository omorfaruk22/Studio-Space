"use client";

import Image from "next/image";
import {
  Aperture,
  CalendarDays,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { primaryNavigation } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

export type HeaderUser = {
  name: string;
  email: string;
  image?: string | null;
  onLogout: () => void;
};

type SiteHeaderProps = {
  user?: HeaderUser | null;
};

const accountLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Add New Studio", href: "/add-studio", icon: Plus },
  { label: "Saved Studios", href: "/saved-studios", icon: Heart },
  { label: "My Studio Listings", href: "/my-listings", icon: Aperture },
  { label: "My Bookings", href: "/my-bookings", icon: CalendarDays },
  { label: "Booking Requests", href: "/host-bookings", icon: CalendarDays },
] as const;

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function UserAvatar({ user }: { user: HeaderUser }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-sage text-xs font-bold text-forest" aria-hidden="true">
      {user.image ? (
        <Image src={user.image} alt="" width={32} height={32} unoptimized className="size-full object-cover" />
      ) : initials(user.name)}
    </span>
  );
}

export function SiteHeader({ user = null }: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!profileOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  const isCurrentPage = (href: string) => {
    if (href.includes("#")) return false;
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavLinks = (mobile = false) => (
    <>
      {primaryNavigation.map((item) => {
        const active = isCurrentPage(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex min-h-11 items-center text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus",
              mobile ? "w-full rounded-xl px-3" : "px-2",
              active ? "text-brand-strong" : "text-ink/75 hover:text-ink",
              mobile && active && "bg-sand",
            )}
          >
            {item.label}
            {!mobile && active ? (
              <span aria-hidden="true" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
            ) : null}
          </Link>
        );
      })}
    </>
  );

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-line/80 bg-canvas/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-page items-center justify-between gap-3 px-4 sm:gap-5 sm:px-8 xl:px-12">
        <Link href="/" className="group inline-flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
          <span className="grid size-10 place-items-center rounded-full bg-forest text-white transition group-hover:bg-brand">
            <Aperture size={21} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-[1.15rem] font-semibold tracking-tight text-ink min-[380px]:text-[1.35rem]">StudioSpace</span>
            <span className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-muted sm:block">Room to create</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
          {renderNavLinks()}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/add-studio" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                <Plus size={16} aria-hidden="true" /> Host a space
              </Link>
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-ink hover:border-forest/30 focus-visible:outline-2 focus-visible:outline-focus"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  onClick={() => setProfileOpen((open) => !open)}
                >
                  <UserAvatar user={user} />
                  <span className="max-w-24 truncate">{user.name.split(" ")[0]}</span>
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 rounded-2xl border border-line bg-white p-2 shadow-dialog" role="menu">
                    <div className="border-b border-line px-3 py-3">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="mt-1 truncate text-xs text-muted">{user.email}</p>
                    </div>
                    {accountLinks.map(({ label, href, icon: Icon }) => (
                      <Link key={href} href={href} role="menuitem" onClick={() => setProfileOpen(false)} className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-ink/80 transition hover:bg-sand hover:text-ink">
                        <Icon size={16} aria-hidden="true" /> {label}
                      </Link>
                    ))}
                    <button type="button" role="menuitem" onClick={user.onLogout} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-700 transition hover:bg-red-50">
                      <LogOut size={16} aria-hidden="true" /> Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-ink transition hover:bg-sand focus-visible:outline-2 focus-visible:outline-focus">Log in</Link>
              <Link href="/register" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Create account</Link>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-line bg-white text-ink transition hover:bg-sand focus-visible:outline-2 focus-visible:outline-focus"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-navigation" className="max-h-[calc(100dvh-76px)] overflow-y-auto overscroll-contain border-t border-line bg-canvas px-4 py-4 shadow-card sm:px-5 lg:hidden">
          <nav className="mx-auto flex max-w-page flex-col gap-1" aria-label="Mobile navigation">
            {renderNavLinks(true)}
            <div className="mt-3 grid gap-3 border-t border-line pt-4">
              {user ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full border border-line bg-white px-2 text-sm font-semibold text-ink"><UserAvatar user={user} /> Account</Link>
                    <button type="button" onClick={() => { setMobileOpen(false); user.onLogout(); }} className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full bg-forest px-2 text-sm font-semibold text-white"><LogOut size={16} aria-hidden="true" /> Log out</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {accountLinks.slice(1).map(({ label, href }) => (
                      <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex min-h-11 min-w-0 items-center justify-center rounded-xl bg-white px-3 py-2 text-center text-xs font-medium leading-4 text-ink">{label}</Link>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-ink">Log in</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">Create account</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
