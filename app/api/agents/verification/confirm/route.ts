import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getSql } from "@/lib/neon/db";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";
import { hasTrustedOrigin } from "@/lib/security/origin";
import { confirmSignature } from "@/lib/security/wallet-verification";
import { signatureConfirmSchema } from "@/lib/validation/agent";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Untrusted request origin" }, { status: 403 });
  if (!rateLimit(`confirm:${requestKey(request)}`, 10).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  try {
    const input = signatureConfirmSchema.parse(await request.json());
    const sql = getSql();
    if (!sql) return NextResponse.json({ error: "Verification persistence requires Neon" }, { status: 503 });
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const wallets = await sql.query(`select w.id,a.starting_capital from agent_wallets w join agents a on a.id=w.agent_id where a.id=$1 and w.address=$2 and a.owner_id=$3 limit 1`, [input.agentId, input.address, user.id]) as Array<{ id: string; starting_capital: string }>;
    if (!wallets[0]) return NextResponse.json({ error: "Agent ownership check failed" }, { status: 403 });
    await confirmSignature(input);
    const verified = await sql.query(`with updated_wallet as (update agent_wallets set verified_at=now() where id=$1 returning verified_at) update agents set verified_at=(select verified_at from updated_wallet),updated_at=now() where id=$2 and owner_id=$3 returning verified_at`, [wallets[0].id, input.agentId, user.id]) as Array<{ verified_at: string }>;
    if (!verified[0]) throw new Error("Could not persist verification");
    await sql.query("insert into agent_metrics (agent_id,portfolio_value_usd) values ($1,$2) on conflict (agent_id) do nothing", [input.agentId, wallets[0].starting_capital]);
    await sql.query("insert into portfolio_snapshots (agent_id,equity_usd,realized_pnl_usd,unrealized_pnl_usd) select $1,$2,0,0 where not exists (select 1 from portfolio_snapshots where agent_id=$1)", [input.agentId, wallets[0].starting_capital]);
    const battles = await sql.query("insert into battles (slug,name,description,starts_at,ends_at,starting_balance,rules) values ('open-arena','Open Arena','The continuous public Robinhood Chain agent competition.',now(),now()+interval '10 years',10000,$1::jsonb) on conflict (slug) do update set ends_at=greatest(battles.ends_at,now()+interval '10 years') returning id,slug", [JSON.stringify({ scoring: "total return", accounting: "FIFO", assets: "canonical Robinhood Stock Tokens" })]) as Array<{ id: string; slug: string }>;
    await sql.query("insert into battle_participants (battle_id,agent_id) values ($1,$2) on conflict do nothing", [battles[0].id, input.agentId]);
    await sql.query("insert into battle_snapshots (battle_id,agent_id,equity_usd,return_pct) values ($1,$2,$3,0)", [battles[0].id, input.agentId, wallets[0].starting_capital]);
    return NextResponse.json({ verified: true, verifiedAt: verified[0].verified_at, battle: battles[0].slug }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 400 });
  }
}
