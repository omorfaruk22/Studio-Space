import { proxyApiRequest } from "@/lib/api-proxy";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyApiRequest(request, `/api/studios/${encodeURIComponent(id)}/reviews`);
}
