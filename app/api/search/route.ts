import { NextResponse } from "next/server";
import { getSql } from "@/lib/neon/db";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (!query) return NextResponse.json({ data: [] });
  const walletEntry = /^0x[\da-fA-F]{40}$/.test(query) ? [{ label: `${query.slice(0, 6)}…${query.slice(-4)}`, meta: "Analyze public wallet via live APIs", href: `/wallet/${query.toLowerCase()}` }] : [];
  const sql = getSql();
  if (!sql) return NextResponse.json({ data: walletEntry });
  const like = `%${query}%`;
  const [agents, tokens, battles] = await Promise.all([
    sql.query("select name as label,'Agent · '||strategy||' · '||w.address as meta,'/agent/'||slug as href from agents a join agent_wallets w on w.agent_id=a.id where a.verified_at is not null and (a.name ilike $1 or a.strategy ilike $1 or w.address ilike $1) order by a.name limit 5", [like]),
    sql.query("select symbol as label,'Canonical Stock Token' as meta,'/stock-tokens?symbol='||symbol as href from stock_tokens where active=true and symbol ilike $1 order by symbol limit 5", [like]),
    sql.query("select name as label,'Battle' as meta,'/battle/'||slug as href from battles where ends_at>now() and name ilike $1 order by starts_at desc limit 5", [like]),
  ]);
  return NextResponse.json({ data: [...walletEntry, ...agents, ...tokens, ...battles].slice(0, 10) }, { headers: { "Cache-Control": "no-store" } });
}
