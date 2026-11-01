import { proxyApiRequest } from "@/lib/api-proxy";

export const POST = (request: Request) => proxyApiRequest(request, "/api/uploads/images");
