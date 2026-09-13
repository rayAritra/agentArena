import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getSql } from "@/lib/neon/db";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";
import { confirmSignature } from "@/lib/security/wallet-verification";
import { signatureConfirmSchema } from "@/lib/validation/agent";

export async function POST(request: Request) {
  if (!rateLimit(`confirm:${requestKey(request)}`, 10).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  try {
    const input = signatureConfirmSchema.parse(await request.json());
    const sql = getSql();
    if (!sql) return NextResponse.json({ error: "Verification persistence requires Neon" }, { status: 503 });
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const wallets = await sql.query(`select w.id from agent_wallets w join agents a on a.id=w.agent_id where a.id=$1 and w.address=$2 and a.owner_id=$3 limit 1`, [input.agentId, input.address, user.id]) as Array<{ id: string }>;
    if (!wallets[0]) return NextResponse.json({ error: "Agent ownership check failed" }, { status: 403 });
    await confirmSignature(input);
    const verified = await sql.query(`with updated_wallet as (update agent_wallets set verified_at=now() where id=$1 returning verified_at) update agents set verified_at=(select verified_at from updated_wallet),updated_at=now() where id=$2 and owner_id=$3 returning verified_at`, [wallets[0].id, input.agentId, user.id]) as Array<{ verified_at: string }>;
    if (!verified[0]) throw new Error("Could not persist verification");
    return NextResponse.json({ verified: true, verifiedAt: verified[0].verified_at }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 400 });
  }
}
