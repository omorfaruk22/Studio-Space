import { proxyApiRequest } from "@/lib/api-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return Response.json({ status: "error", message: "Invalid booking ID." }, { status: 400 });
  }
  return proxyApiRequest(request, `/api/admin/bookings/${encodeURIComponent(id)}/status`);
}
