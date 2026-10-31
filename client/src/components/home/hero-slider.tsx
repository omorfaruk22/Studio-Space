"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const slides = [
  {
    eyebrow: "Space for the first frame",
    title: <>Find the light.<br />Make the <em className="font-normal text-[#efb99a]">moment.</em></>,
    description: "From sunlit studios to fully equipped sets, find a backdrop that brings your next idea into focus.",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2200&q=90",
    alt: "A light-filled creative studio with large windows and a long shared worktable",
    position: "center 52%",
  },
  {
    eyebrow: "A room with its own rhythm",
    title: <>Make some<br /><em className="font-normal text-[#efb99a]">beautiful noise.</em></>,
    description: "Discover recording rooms, rehearsal spaces, and sound stages built for ideas worth hearing.",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=2200&q=90",
    alt: "Warmly lit recording studio with a mixing desk and acoustic treatment",
    position: "center 50%",
  },
  {
    eyebrow: "Good things take shape here",
    title: <>Your next idea<br />needs a little <em className="font-normal text-[#efb99a]">room.</em></>,
    description: "Find a workshop, a set, or a quiet corner to make the thing you have been thinking about.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=2200&q=90",
    alt: "A thoughtfully designed creative interior with warm natural materials",
    position: "center 55%",
  },
];

export function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const goTo = useCallback((index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused || isHovered || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isPaused, isHovered]);

  return (
    <section
      className="mx-auto max-w-page px-4 pt-4 sm:px-8 sm:pt-6 xl:px-12"
      aria-label="Featured creative spaces"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
      }}
    >
      <div className="relative isolate min-h-[570px] overflow-hidden rounded-[2rem] bg-forest text-white sm:min-h-[610px] lg:min-h-[650px]" role="region" aria-roledescription="carousel">
        {slides.map((slide, index) => (
          <div
            key={slide.eyebrow}
            className={`absolute inset-0 z-0 transition-opacity duration-700 motion-reduce:transition-none ${index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            aria-hidden={index !== activeIndex}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 1440px"
              className="object-cover"
              style={{ objectPosition: slide.position }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,35,37,.92)_0%,rgba(12,35,37,.77)_42%,rgba(12,35,37,.18)_100%),linear-gradient(0deg,rgba(12,35,37,.42),transparent_45%)]" />
          </div>
        ))}

        <div className="relative z-10 flex min-h-[570px] flex-col justify-between px-6 py-8 sm:min-h-[610px] sm:px-10 sm:py-10 lg:min-h-[650px] lg:px-16 lg:py-14">
          <div aria-live={isPaused ? "polite" : "off"} aria-atomic="true" className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm sm:text-xs">
              <span className="size-1.5 rounded-full bg-[#efb99a]" aria-hidden="true" /> {slides[activeIndex].eyebrow}
            </p>
            <h1 className="mt-7 font-serif text-[2.8rem] leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.75rem]">{slides[activeIndex].title}</h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/75 sm:mt-6 sm:text-lg sm:leading-8">{slides[activeIndex].description}</p>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Link href="/studios" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Explore studios <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/add-studio" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Host your space <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-2" aria-label="Choose a slide">
              {slides.map((slide, index) => (
                <button
                  key={slide.eyebrow}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  className={`h-1.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${index === activeIndex ? "w-10 bg-white" : "w-5 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
              <span className="ml-2 text-xs font-medium tabular-nums text-white/70">0{activeIndex + 1} / 0{slides.length}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Previous slide" className="grid size-10 place-items-center rounded-full border border-white/35 bg-white/5 text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-11"><ArrowLeft size={18} aria-hidden="true" /></button>
              <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Next slide" className="grid size-10 place-items-center rounded-full border border-white/35 bg-white/5 text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-11"><ArrowRight size={18} aria-hidden="true" /></button>
              <button type="button" onClick={() => setIsPaused((paused) => !paused)} aria-label={isPaused ? "Play slides" : "Pause slides"} aria-pressed={isPaused} className="grid size-10 place-items-center rounded-full border border-white/35 bg-white/5 text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-11">{isPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
