import { NextResponse } from "next/server";
import { getStockTokens } from "@/lib/data/repository";
import { depegSeverity, deviationPercent } from "@/lib/market/depeg";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = (await getStockTokens()).map((token) => {
      const deviation = token.price === null ? null : deviationPercent(token.price, token.reference);
      return { ...token, deviation, severity: deviation === null ? "unavailable" : depegSeverity(deviation) };
    });
    return NextResponse.json({ data, meta: { marketSource: "DEX Screener", referenceSource: "Robinhood RHJ API", priceType: "DEX execution-market price compared with multiplier-adjusted official reference", updatedAt: new Date().toISOString() } }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } });
  } catch {
    return NextResponse.json({ error: "Live Stock Token data unavailable" }, { status: 503 });
  }
}
