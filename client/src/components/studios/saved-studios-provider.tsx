"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type SavedStudiosContextValue = {
  savedIds: ReadonlySet<string>;
  ready: boolean;
  pendingIds: ReadonlySet<string>;
  toggleSaved: (studioId: string, studioTitle: string) => Promise<void>;
};

const SavedStudiosContext = createContext<SavedStudiosContextValue | null>(null);

export function SavedStudiosProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const userId = session?.user?.id;
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const ready = !sessionPending && loadedUserId === (userId ?? null);

  const loadSavedStudios = useCallback(async (signal: AbortSignal, currentUserId?: string) => {
    try {
      const response = await fetch("/api/saved-studios", { cache: "no-store", credentials: "same-origin", signal });
      if (response.status === 401) {
        setSavedIds(new Set());
        return;
      }
      if (!response.ok) throw new Error("Could not load saved studios.");
      const result = await response.json() as { studioIds?: unknown };
      setSavedIds(new Set(Array.isArray(result.studioIds) ? result.studioIds.filter((id): id is string => typeof id === "string") : []));
    } catch {
      if (!signal?.aborted) setSavedIds(new Set());
    } finally {
      if (!signal.aborted) setLoadedUserId(currentUserId ?? null);
    }
  }, []);

  useEffect(() => {
    if (sessionPending) return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) void loadSavedStudios(controller.signal, userId);
    });
    return () => controller.abort();
  }, [loadSavedStudios, sessionPending, userId]);

  const toggleSaved = useCallback(async (studioId: string, studioTitle: string) => {
    if (pendingIds.has(studioId)) return;
    const wasSaved = savedIds.has(studioId);
    setPendingIds((current) => new Set(current).add(studioId));
    try {
      const response = await fetch(`/api/saved-studios/${encodeURIComponent(studioId)}`, {
        method: wasSaved ? "DELETE" : "PUT",
        credentials: "same-origin",
      });
      const result = await response.json() as { message?: string };
      if (response.status === 401) {
        const next = `${window.location.pathname}${window.location.search}`;
        router.push(`/login?next=${encodeURIComponent(next)}`);
        toast.message("Log in to save studios to your list.");
        return;
      }
      if (!response.ok) throw new Error(result.message || "Could not update your saved studios.");

      setSavedIds((current) => {
        const updated = new Set(current);
        if (wasSaved) updated.delete(studioId);
        else updated.add(studioId);
        return updated;
      });
      toast.success(wasSaved ? "Studio removed from your saved list." : "Studio saved for later.", { description: studioTitle });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update your saved studios.");
    } finally {
      setPendingIds((current) => {
        const updated = new Set(current);
        updated.delete(studioId);
        return updated;
      });
    }
  }, [pendingIds, router, savedIds]);

  const value = useMemo(() => ({ savedIds, ready, pendingIds, toggleSaved }), [pendingIds, ready, savedIds, toggleSaved]);
  return <SavedStudiosContext.Provider value={value}>{children}</SavedStudiosContext.Provider>;
}

export function useSavedStudios() {
  const context = useContext(SavedStudiosContext);
  if (!context) throw new Error("useSavedStudios must be used within a SavedStudiosProvider.");
  return context;
}
