"use client";

import Image from "next/image";
import { useState } from "react";
import { Aperture, ArrowLeft, ArrowRight } from "lucide-react";

export function StudioGallery({ title, images }: { title: string; images: string[] }) {
  const gallery = [...new Set(images.filter(Boolean))];
  const [activeIndex, setActiveIndex] = useState(0);

  if (gallery.length === 0) {
    return <div className="grid aspect-[1.8] place-items-center rounded-[2rem] bg-[linear-gradient(135deg,#dce8d8,#eeeae0)] text-forest"><Aperture size={80} strokeWidth={1} aria-hidden="true" /><span className="sr-only">No studio photos have been added yet.</span></div>;
  }

  return (
    <div className="relative isolate aspect-[1.8] overflow-hidden rounded-[2rem] bg-sage" aria-label={`${title} photo gallery`}>
      <Image src={gallery[activeIndex]} alt={`${title}, photo ${activeIndex + 1}`} fill priority sizes="(max-width: 1024px) 100vw, 68vw" unoptimized className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      {gallery.length > 1 ? <>
        <button type="button" onClick={() => setActiveIndex((index) => (index - 1 + gallery.length) % gallery.length)} aria-label="Previous studio photo" className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><ArrowLeft size={19} aria-hidden="true" /></button>
        <button type="button" onClick={() => setActiveIndex((index) => (index + 1) % gallery.length)} aria-label="Next studio photo" className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><ArrowRight size={19} aria-hidden="true" /></button>
        <div className="absolute bottom-4 right-5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white" aria-live="polite">{activeIndex + 1} / {gallery.length}</div>
      </> : null}
    </div>
  );
}
