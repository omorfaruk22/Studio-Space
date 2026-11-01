"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const themeStorageKey = "studiospace-theme";
const themeChangeEvent = "studio-space-theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(themeChangeEvent, onChange);
  return () => window.removeEventListener(themeChangeEvent, onChange);
}

function getSnapshot() {
  return document.documentElement.dataset.theme === "dark";
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    const nextDark = !getSnapshot();
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    window.dispatchEvent(new Event(themeChangeEvent));
    try {
      window.localStorage.setItem(themeStorageKey, nextDark ? "dark" : "light");
    } catch {
      // The selected theme still applies for this page if storage is unavailable.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      aria-pressed={dark}
      title={`Switch to ${dark ? "light" : "dark"} theme`}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-white text-ink transition hover:bg-sand focus-visible:outline-2 focus-visible:outline-focus"
    >
      {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
