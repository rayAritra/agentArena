import { auth } from "@/lib/auth/server";

const handlers = auth?.handler();
type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: Context) {
  return handlers ? handlers.GET(request, context) : Response.json({ error: "Neon Auth is not configured" }, { status: 503 });
}

export async function POST(request: Request, context: Context) {
  return handlers ? handlers.POST(request, context) : Response.json({ error: "Neon Auth is not configured" }, { status: 503 });
}
