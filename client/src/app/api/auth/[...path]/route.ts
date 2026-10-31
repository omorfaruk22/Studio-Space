type AuthProxyContext = {
  params: Promise<{ path: string[] }>;
};

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function proxyAuthRequest(request: Request, context: AuthProxyContext) {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`/api/auth/${path.map(encodeURIComponent).join("/")}${incomingUrl.search}`, apiOrigin);
  const headers = new Headers(request.headers);

  for (const header of ["host", "connection", "content-length", "accept-encoding"]) {
    headers.delete(header);
  }

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    ...(request.method === "GET" || request.method === "HEAD" ? {} : { body: await request.arrayBuffer() }),
    cache: "no-store",
    redirect: "manual",
  });
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyAuthRequest;
export const POST = proxyAuthRequest;
export const PUT = proxyAuthRequest;
export const PATCH = proxyAuthRequest;
export const DELETE = proxyAuthRequest;
export const OPTIONS = proxyAuthRequest;
