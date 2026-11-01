import { proxyApiRequest } from "@/lib/api-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyApiRequest(request, `/api/host/bookings/${encodeURIComponent(id)}/confirm`);
}
