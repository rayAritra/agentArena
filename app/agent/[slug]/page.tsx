import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { ShareActions } from "@/components/agents/share-actions";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { getAgent } from "@/lib/data/repository";
import { getAgentIntelligence } from "@/lib/data/intelligence";
import { compactAddress, percent, usd } from "@/lib/utils";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const a = await getAgent((await params).slug);
  return a
    ? {
        title: `${a.name} — ${percent(a.roi)} ROI`,
        description: a.description,
        openGraph: { images: [`/api/og/agent/${a.slug}`] },
      }
    : { title: "Agent not found" };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const a = await getAgent((await params).slug);
  if (!a) notFound();
  if (!a.verified) redirect(`/wallet/${a.wallet}`);
  const intelligence = await getAgentIntelligence(a.slug);
  const score = intelligence?.score as Record<string, unknown> | null,
    dna = intelligence?.dna as Record<string, unknown> | null;
  const metrics = [
    ["Arena Score", score ? String(score.arena_score) : "—"],
    ["Agent DNA", dna ? String(dna.primary_archetype) : "Pending"],
    ["Portfolio value", usd(a.portfolio)],
    ["Total P&L", usd(a.pnl)],
    ["Total ROI", percent(a.roi)],
    ["Win rate", `${a.winRate.toFixed(1)}%`],
    ["Trades", String(a.trades)],
    ["Volume", usd(a.volume, true)],
  ];
  return (
    <div className="container py-12">
      <div className="grid gap-10 border-b hairline pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <span className="eyebrow">
            {a.verified
              ? "Verified autonomous trader"
              : "Observed onchain competitor · identity unverified"}
          </span>
          <h1 className="mt-4 flex items-center gap-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
            {a.name}
            {a.verified && <ShieldCheck className="text-neutral-500" />}
          </h1>
          <p className="mono mt-4 text-xs text-neutral-500">
            {compactAddress(a.wallet)} · {a.model} · {a.strategy}
          </p>
          <p className="mt-6 max-w-2xl text-neutral-400">{a.description}</p>
        </div>
        <ShareActions
          name={a.name}
          rank={a.rank}
          roi={percent(a.roi)}
          path={`/agent/${a.slug}`}
        />
      </div>
      <div className="grid grid-cols-2 border-b hairline md:grid-cols-4 xl:grid-cols-8">
        {metrics.map(([label, value]) => (
          <div className="border-r hairline py-5 pr-3" key={label}>
            <span className="eyebrow block text-[9px]">{label}</span>
            <strong
              className={`mono mt-2 block text-lg ${label.includes("P&L") || label.includes("ROI") ? (String(value).startsWith("-") ? "negative" : "positive") : ""}`}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <section>
          <div className="flex justify-between">
            <span className="eyebrow">
              Portfolio value · all indexed history
            </span>
            <span className="eyebrow">
              Block {a.lastSyncedBlock ?? "pending first sync"}
            </span>
          </div>
          <PerformanceChart values={a.series} negative={a.pnl < 0} />
        </section>
        <aside className="border-l hairline pl-6">
          <span className="eyebrow">Risk &amp; execution</span>
          {[
            ["Profit factor", a.profitFactor.toFixed(2)],
            ["Max drawdown", percent(a.maxDrawdown)],
            ["Average win", usd(a.averageWin)],
            ["Average loss", usd(a.averageLoss)],
            ["Realized P&L", usd(a.realizedPnl)],
            ["Unrealized P&L", usd(a.unrealizedPnl)],
          ].map(([label, value]) => (
            <div
              className="flex justify-between border-b hairline py-4 text-sm"
              key={label}
            >
              <span className="text-neutral-500">{label}</span>
              <span className="mono">{value}</span>
            </div>
          ))}
        </aside>
      </div>
      <section className="mt-14">
        <div className="flex items-end justify-between border-b hairline pb-4">
          <div>
            <span className="eyebrow">Canonical holdings</span>
            <h2 className="mt-2 text-2xl font-black">POSITIONS</h2>
          </div>
          <Link href="/methodology" className="text-xs font-black underline">
            FIFO METHODOLOGY
          </Link>
        </div>
        {a.positions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="eyebrow text-[9px]">
                <tr>
                  {[
                    "Asset",
                    "Quantity",
                    "Cost basis",
                    "Current price",
                    "Market value",
                    "Unrealized",
                    "Realized",
                  ].map((x) => (
                    <th className="py-4" key={x}>
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.positions.map((p) => (
                  <tr
                    className="border-t hairline font-mono"
                    key={p.assetAddress}
                  >
                    <td className="py-4 font-black">{p.symbol}</td>
                    <td>{p.quantity}</td>
                    <td>{usd(p.costBasis)}</td>
                    <td>{usd(p.currentPrice)}</td>
                    <td>{usd(p.marketValue)}</td>
                    <td
                      className={p.unrealizedPnl >= 0 ? "positive" : "negative"}
                    >
                      {usd(p.unrealizedPnl)}
                    </td>
                    <td
                      className={p.realizedPnl >= 0 ? "positive" : "negative"}
                    >
                      {usd(p.realizedPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="border-b hairline py-10 text-center text-sm text-neutral-500">
            No open canonical Stock Token positions at the latest indexed block.
          </p>
        )}
      </section>
      <section className="mt-14">
        <span className="eyebrow">Normalized onchain execution</span>
        <h2 className="mt-2 text-2xl font-black">RECENT TRADES</h2>
        {a.recentTrades.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="eyebrow text-[9px]">
                <tr>
                  {[
                    "Time",
                    "Side",
                    "Asset",
                    "Quantity",
                    "Price",
                    "Notional",
                    "Fee",
                    "Tx",
                  ].map((x) => (
                    <th className="py-4" key={x}>
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.recentTrades.map((t) => (
                  <tr className="border-t hairline font-mono" key={t.id}>
                    <td className="py-4">
                      {new Date(t.tradedAt).toLocaleString()}
                    </td>
                    <td className={t.side === "buy" ? "positive" : "negative"}>
                      {t.side.toUpperCase()}
                    </td>
                    <td className="font-black">{t.symbol}</td>
                    <td>{t.quantity}</td>
                    <td>{usd(t.price)}</td>
                    <td>{usd(t.quoteAmount)}</td>
                    <td>{usd(t.fee)}</td>
                    <td>
                      <a
                        className="underline"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://robinhoodchain.blockscout.com/tx/${t.txHash}`}
                      >
                        {compactAddress(t.txHash)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 border-y hairline py-10 text-center text-sm text-neutral-500">
            No qualifying USDG/Stock Token trades have been indexed for this
            wallet yet.
          </p>
        )}
      </section>
    </div>
  );
}
