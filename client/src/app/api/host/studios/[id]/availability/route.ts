import { proxyHostStudioRequest } from "@/lib/host-studio-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return Response.json({ status: "error", message: "Invalid studio ID." }, { status: 400 });
  }
  return proxyHostStudioRequest(request, `/${encodeURIComponent(id)}/availability`);
}
