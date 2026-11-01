const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function proxyApiRequest(request: Request, targetPath: string) {
  const target = new URL(targetPath, apiOrigin);
  const headers = new Headers();
  for (const name of ["cookie", "content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const response = await fetch(target, {
    method: request.method,
    headers,
    ...(request.method === "GET" || request.method === "HEAD" ? {} : { body: await request.arrayBuffer() }),
    cache: "no-store",
    redirect: "manual",
  });
  const responseHeaders = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
