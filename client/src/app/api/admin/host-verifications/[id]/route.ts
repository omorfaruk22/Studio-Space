import { proxyApiRequest } from "@/lib/api-proxy";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyApiRequest(request, `/api/admin/host-verifications/${encodeURIComponent(id)}`);
}
