import { headers } from "next/headers";

export type CurrentSession = {
  user: { id: string; name: string; email: string; image?: string | null };
  session: { id: string; expiresAt: string };
};

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");
  if (!cookie) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const response = await fetch(`${apiUrl}/api/session`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Could not verify your StudioSpace session.");
  return response.json() as Promise<CurrentSession | null>;
}
