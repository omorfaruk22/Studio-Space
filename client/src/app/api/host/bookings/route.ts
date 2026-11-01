import { proxyApiRequest } from "@/lib/api-proxy";

export const GET = (request: Request) => proxyApiRequest(request, "/api/host/bookings");
