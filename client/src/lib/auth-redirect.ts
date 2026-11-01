const callbackOrigin = "https://studiospace.invalid";

/** Resolve the optional `next` route without allowing external redirects. */
export function getAuthCallbackUrl(pathname: string, search: string): string {
  if (pathname !== "/login") return "/";

  const requestedPath = new URLSearchParams(search).get("next");
  if (!requestedPath) return "/";

  try {
    const callback = new URL(requestedPath, callbackOrigin);
    if (callback.origin !== callbackOrigin || requestedPath.includes("\\")) return "/";
    return `${callback.pathname}${callback.search}${callback.hash}`;
  } catch {
    return "/";
  }
}
