import { proxyApiRequest } from "@/lib/api-proxy";

type RouteContext = { params: Promise<{ studioId: string }> };

async function proxySavedStudio(request: Request, context: RouteContext) {
  const { studioId } = await context.params;
  if (!/^[a-f\d]{24}$/i.test(studioId)) {
    return Response.json({ status: "error", message: "Invalid studio ID." }, { status: 400 });
  }
  return proxyApiRequest(request, `/api/saved-studios/${encodeURIComponent(studioId)}`);
}

export const PUT = proxySavedStudio;
export const DELETE = proxySavedStudio;
