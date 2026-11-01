import { proxyHostStudioRequest } from "@/lib/host-studio-proxy";

export const GET = (request: Request) => proxyHostStudioRequest(request);
export const POST = (request: Request) => proxyHostStudioRequest(request);
