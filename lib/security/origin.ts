import { env } from "@/lib/env";

export function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set([new URL(request.url).origin, new URL(env.NEXT_PUBLIC_APP_URL).origin]);
  return allowed.has(origin);
}
