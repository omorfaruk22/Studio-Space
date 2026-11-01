"use client";

import { Heart } from "lucide-react";
import { useSavedStudios } from "@/components/studios/saved-studios-provider";

export function FavoriteButton({ studioId, studioTitle }: { studioId: string; studioTitle: string }) {
  const { savedIds, ready, pendingIds, toggleSaved } = useSavedStudios();
  const saved = savedIds.has(studioId);
  const pending = pendingIds.has(studioId);

  return (
    <button
      type="button"
      aria-label={saved ? `Remove ${studioTitle} from saved studios` : `Save ${studioTitle}`}
      aria-pressed={saved}
      title={saved ? "Remove from saved studios" : "Save this studio"}
      disabled={!ready || pending}
      onClick={() => void toggleSaved(studioId, studioTitle)}
      className="absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full bg-white/95 text-ink shadow-card transition hover:scale-105 hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-70"
    >
      <Heart size={18} className={saved ? "fill-brand text-brand" : ""} aria-hidden="true" />
    </button>
  );
}
