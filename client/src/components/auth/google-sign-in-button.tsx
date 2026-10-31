"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    fetch(`${apiUrl}/api/auth/config`)
      .then((response) => response.ok ? response.json() as Promise<{ googleEnabled: boolean }> : Promise.reject())
      .then((config) => setIsConfigured(config.googleEnabled))
      .catch(() => setIsConfigured(false));
  }, []);

  async function signInWithGoogle() {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
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
      <Button type="button" variant="outline" className="w-full" disabled={isLoading || isConfigured !== true} onClick={signInWithGoogle}>
        <GoogleMark /> {isLoading ? "Connecting to Google…" : isConfigured === false ? "Google sign-in setup required" : "Continue with Google"}
      </Button>
      {isConfigured === false ? <p className="mt-2 text-center text-xs leading-5 text-muted">Add Google OAuth credentials in the server&apos;s <code>.env.local</code> file to enable this option.</p> : null}
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
