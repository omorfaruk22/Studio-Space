import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Studio not found | StudioSpace",
  description: "This creative space could not be found. Explore studios on StudioSpace.",
};

function StudioNotFoundIllustration() {
  return (
    <svg viewBox="0 0 560 360" className="mx-auto w-full max-w-[34rem]" aria-hidden="true">
      <defs>
        <linearGradient id="studio-wall" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#285448" />
          <stop offset="1" stopColor="#102f32" />
        </linearGradient>
        <linearGradient id="studio-light" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0" stopColor="#efb783" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ffd9a3" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="studio-glow">
          <stop offset="0" stopColor="#f3b66f" stopOpacity="0.7" />
          <stop offset="1" stopColor="#f3b66f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="10" y="10" width="540" height="340" rx="32" fill="url(#studio-wall)" />
      <circle cx="324" cy="170" r="150" fill="url(#studio-glow)" className="studio-404-glow" />
      <path d="M10 258 550 215v103a32 32 0 0 1-32 32H42a32 32 0 0 1-32-32Z" fill="#102f32" opacity=".72" />
      <path d="m34 318 492-46M80 344l408-55M280 286l-58 64m156-79 47 67" fill="none" stroke="#6c8b7b" strokeOpacity=".38" strokeWidth="2" />
      <path d="M204 292V119a76 76 0 0 1 152 0v151" fill="#0c2829" stroke="#d4a57d" strokeOpacity=".72" strokeWidth="5" />
      <path d="M221 276V122a59 59 0 0 1 118 0v142Z" fill="url(#studio-light)" className="studio-404-light" />
      <path d="M264 277V135a16 16 0 0 1 32 0v138" fill="#d27a55" opacity=".72" />
      <circle cx="285" cy="207" r="7" fill="#fff0ce" />
      <path d="M96 192h57v70H96zM408 163h56v85h-56z" fill="#183f42" stroke="#739083" strokeOpacity=".5" strokeWidth="3" />
      <path d="M105 202h39m-39 13h39m-39 13h39m273-54h38m-38 13h38m-38 13h38" stroke="#88a195" strokeOpacity=".5" strokeWidth="3" />
      <path d="M279 51v22m-28-10h56" stroke="#f1c292" strokeWidth="4" strokeLinecap="round" />
      <circle cx="279" cy="48" r="9" fill="#f1c292" />
      <g className="studio-404-orbit" fill="none" stroke="#efb99a" strokeOpacity=".8" strokeWidth="2">
        <circle cx="280" cy="190" r="113" strokeDasharray="4 9" />
        <circle cx="280" cy="190" r="130" strokeDasharray="2 13" />
      </g>
      <text x="42" y="68" fill="#fff7eb" fontFamily="Georgia, serif" fontSize="29" fontWeight="700">404</text>
      <text x="424" y="307" fill="#efb99a" fontFamily="Arial, sans-serif" fontSize="11" letterSpacing="2">OUT OF FRAME</text>
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:px-8 sm:py-16 xl:px-12">
      <StudioNotFoundIllustration />
      <div className="mt-8 max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-strong">Nothing in this frame</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">We can’t find that studio.</h1>
        <p className="mt-4 text-base leading-7 text-muted">The page may have moved, or this creative space is no longer available. Let’s find another place for your next idea.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><Home size={16} aria-hidden="true" />Return to Home</Link>
          <Link href="/studios" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-white px-6 text-sm font-semibold text-ink transition hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Explore studios<ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </main>
  );
}
