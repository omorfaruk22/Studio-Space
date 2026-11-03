"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [configState, setConfigState] = useState<"checking" | "enabled" | "disabled" | "unavailable">("checking");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/config", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ googleEnabled: boolean }> : Promise.reject())
      .then((config) => {
        if (!cancelled) setConfigState(config.googleEnabled ? "enabled" : "disabled");
      })
      .catch(() => {
        if (!cancelled) setConfigState("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function signInWithGoogle() {
    setIsLoading(true);
    try {
      const callbackURL = getAuthCallbackUrl(window.location.pathname, window.location.search);
      const result = await authClient.signIn.social({ provider: "google", callbackURL });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in could not be started.");
        setIsLoading(false);
      }
    } catch {
      toast.error("Could not connect to the authentication server.");
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="outline" className="w-full" disabled={isLoading || configState !== "enabled"} onClick={signInWithGoogle}>
        <GoogleMark /> {isLoading ? "Connecting to Google…" : configState === "checking" ? "Checking Google sign-in…" : configState === "disabled" ? "Google sign-in setup required" : configState === "unavailable" ? "Google sign-in unavailable" : "Continue with Google"}
      </Button>
      {configState === "disabled" ? <p className="mt-2 text-center text-xs leading-5 text-muted">Google OAuth credentials are not configured on the authentication server.</p> : null}
      {configState === "unavailable" ? <p className="mt-2 text-center text-xs leading-5 text-muted">Could not reach the authentication service. Refresh the page and try again.</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-[18px]">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.26 5.48-4.73 7.18l7.72 5.99c4.5-4.16 7.08-10.29 7.08-17.64Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 4)" />
      <path fill="#34A853" d="M24 48c6.47 0 11.9-2.13 15.87-5.81l-7.72-5.99c-2.13 1.43-4.85 2.3-8.15 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -4)" />
    </svg>
  );
}
