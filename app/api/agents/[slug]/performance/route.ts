import { NextResponse } from "next/server";
import { getAgent } from "@/lib/data/repository";
import { getSql } from "@/lib/neon/db";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ data: agent.series.map((equity, index) => ({ index, equity })), meta: { mode: "demo" } });
  try {
    const data = await sql.query(`select s.equity_usd,s.realized_pnl_usd,s.unrealized_pnl_usd,s.captured_at from portfolio_snapshots s join agents a on a.id=s.agent_id where a.slug=$1 order by s.captured_at`, [slug]);
    return NextResponse.json({ data, meta: { methodology: "FIFO", source: "Robinhood Chain" } });
  } catch {
    return NextResponse.json({ error: "Performance unavailable" }, { status: 503 });
  }
}
