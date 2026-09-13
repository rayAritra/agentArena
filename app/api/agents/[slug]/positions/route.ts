import { NextResponse } from "next/server";
import { getAgent } from "@/lib/data/repository";
import { getSql } from "@/lib/neon/db";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ data: [], meta: { mode: "demo", message: "No persisted positions without Neon" } });
  try {
    const data = await sql.query(`select p.id,p.asset_address,p.symbol,p.quantity,p.cost_basis_usd,p.realized_pnl_usd,p.updated_at from positions p join agents a on a.id=p.agent_id where a.slug=$1 order by p.symbol`, [slug]);
    return NextResponse.json({ data, meta: { methodology: "FIFO" } });
  } catch {
    return NextResponse.json({ error: "Positions unavailable" }, { status: 503 });
  }
}
