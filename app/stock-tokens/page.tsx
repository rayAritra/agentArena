import { getStockTokens } from "@/lib/data/repository";
import { depegSeverity, deviationPercent } from "@/lib/market/depeg";
import { percent, usd } from "@/lib/utils";

export const metadata = { title: "Stock Token watch" };
export const dynamic = "force-dynamic";

export default async function StockTokensPage() {
  const tokens = await getStockTokens();
  const rows = tokens.map((token) => ({ ...token, deviation: token.price === null ? null : deviationPercent(token.price, token.reference) })).sort((a, b) => Math.abs(b.deviation ?? -1) - Math.abs(a.deviation ?? -1));
  const withMarkets = rows.filter((token) => token.marketAvailable);
  const alerts = withMarkets.filter((token) => Math.abs(token.deviation ?? 0) >= .75);
  return <div className="container py-12">
    <span className="eyebrow">Live market integrity · {tokens.length} official assets</span>
    <h1 className="mt-4 text-5xl font-black tracking-[-.03em] md:text-6xl">Stock Token watch</h1>
    <p className="mt-5 max-w-2xl text-muted">Real Uniswap market prices from DEX Screener compared with Robinhood’s official multiplier-adjusted references. Assets without an indexed liquid market are marked unavailable.</p>
    <div className="card mt-10 grid grid-cols-3 divide-x divide-line"><Metric label="DEX markets" value={withMarkets.length.toLocaleString()} /><Metric label="Reference assets" value={tokens.length.toLocaleString()} /><Metric label="Warnings" value={alerts.length.toLocaleString()} tone={alerts.length ? "warning" : "positive"} /></div>
    <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{rows.map((token) => {
      const severity = token.deviation === null ? "unavailable" : depegSeverity(token.deviation);
      return <article className="card card-hover p-6" key={token.symbol}>
        <div className="flex justify-between"><span className="text-2xl font-black">{token.symbol}</span><span className={`badge ${severity === "normal" ? "badge-positive" : severity === "critical" ? "badge-negative" : severity === "unavailable" ? "badge-neutral" : "badge-warning"}`}>{severity}</span></div>
        <strong className="mono mt-10 block text-4xl">{token.price === null ? "—" : usd(token.price)}</strong>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-xs"><span className="text-muted">Reference {usd(token.reference)}</span><span className={`mono ${token.deviation === null ? "text-muted" : token.deviation >= 0 ? "positive" : "negative"}`}>{token.deviation === null ? "No market" : percent(token.deviation)}</span></div>
        <div className="mt-8 flex justify-between"><span className="eyebrow">24H {token.day === null ? "—" : percent(token.day)}</span><span className="eyebrow">Vol {token.volume === null ? "—" : usd(token.volume, true)}</span></div>
      </article>;
    })}</div>
    <div className="mt-12 border-t border-line pt-5 text-xs text-muted">DEX market: DEX Screener · Official reference and asset registry: Robinhood RHJ API · 15-second cache · unavailable values are never guessed.</div>
  </div>;
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) { return <div className="p-5"><span className="eyebrow block">{label}</span><strong className={`mono mt-2 block text-2xl ${tone}`}>{value}</strong></div>; }
