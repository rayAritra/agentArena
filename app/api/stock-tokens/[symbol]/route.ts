import { NextResponse } from "next/server";
import { getLiveStockTokens } from "@/lib/prices/robinhood";
import { depegSeverity, deviationPercent } from "@/lib/market/depeg";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: RouteContext<"/api/stock-tokens/[symbol]">) {
  try {
    const symbol = (await params).symbol.toUpperCase();
    const item = (await getLiveStockTokens([symbol]))[0];
    if (!item) return NextResponse.json({ error: "Stock Token not found" }, { status: 404 });
    const deviation = item.price === null ? null : deviationPercent(item.price, item.reference);
    return NextResponse.json({ data: { ...item, deviation, severity: deviation === null ? "unavailable" : depegSeverity(deviation) }, meta: { marketSource: item.marketAvailable ? "DEX Screener" : null, referenceSource: "Robinhood RHJ API", priceType: "DEX execution-market price compared with multiplier-adjusted official reference" } });
  } catch {
    return NextResponse.json({ error: "Live Stock Token data unavailable" }, { status: 503 });
  }
}
