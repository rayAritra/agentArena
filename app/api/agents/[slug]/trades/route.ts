import { NextResponse } from "next/server";
import { getAgent } from "@/lib/data/repository";
import { getSql } from "@/lib/neon/db";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ data: [], meta: { mode: "demo", message: "No persisted trades without Neon" } });
  try {
    const data = await sql.query(`select t.id,t.side,t.asset_address,t.symbol,t.quantity,t.price_usd,t.quote_amount_usd,t.cost_basis_usd,t.proceeds_usd,t.realized_pnl_usd,t.fee_usd,t.traded_at,x.tx_hash,x.block_number from normalized_trades t join agents a on a.id=t.agent_id join transactions x on x.id=t.transaction_id where a.slug=$1 order by t.traded_at desc limit 100`, [slug]);
    return NextResponse.json({ data, meta: { source: "Robinhood Chain / normalized events" } });
  } catch {
    return NextResponse.json({ error: "Trades unavailable" }, { status: 503 });
  }
}
