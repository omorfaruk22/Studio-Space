import { proxyApiRequest } from "@/lib/api-proxy";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyApiRequest(request, `/api/bookings/${encodeURIComponent(id)}/review`);
}
