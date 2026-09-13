import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Database,
  Eye,
  ShieldAlert,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { ScrollReveal } from "@/components/home/effects";
import { DataRow } from "@/components/ui/data-row";
import { MetricStrip } from "@/components/ui/metric-strip";
import { AddressLookup } from "@/components/wallet/address-lookup";
import { getPublicWalletProfile } from "@/lib/data/wallet-profile";
import { walletSchema } from "@/lib/validation/agent";
import { compactAddress, usd } from "@/lib/utils";

export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const parsed = walletSchema.safeParse((await params).address);
  return {
    title: parsed.success
      ? `Wallet ${compactAddress(parsed.data)} · Live API profile`
      : "Invalid wallet",
  };
}

export default async function WalletPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const parsed = walletSchema.safeParse((await params).address);
  if (!parsed.success) notFound();
  return <Suspense fallback={<WalletLoading address={parsed.data} />}><WalletProfile address={parsed.data}/></Suspense>;
}

async function WalletProfile({address}:{address:string}) {
  const profile = await getPublicWalletProfile(address);
  const pnl =
    profile.metrics.observedRealizedPnlUsd +
    profile.metrics.observedUnrealizedPnlUsd;
  const metrics = [
    { label: "Portfolio mark", value: usd(profile.metrics.portfolioValueUsd) },
    { label: "Observed P&L", value: usd(pnl), tone: pnl >= 0 ? "positive" as const : "negative" as const },
    { label: "Realized", value: usd(profile.metrics.observedRealizedPnlUsd), tone: profile.metrics.observedRealizedPnlUsd >= 0 ? "positive" as const : "negative" as const },
    { label: "Unrealized", value: usd(profile.metrics.observedUnrealizedPnlUsd), tone: profile.metrics.observedUnrealizedPnlUsd >= 0 ? "positive" as const : "negative" as const },
    { label: "Trade volume", value: usd(profile.metrics.observedVolumeUsd, true) },
    { label: "Classified trades", value: String(profile.metrics.classifiedTrades) },
    { label: "Win rate", value: `${profile.metrics.winRate.toFixed(1)}%` },
    { label: "All transfers", value: profile.counters.tokenTransfers.toLocaleString() },
  ];
  return (
    <div className="container py-12">
      <div className="grid gap-10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="badge badge-accent">Direct API wallet profile</span>
            <span className={`badge ${profile.verified ? "badge-positive" : "badge-warning"}`}>
              {profile.verified ? (
                <ShieldCheck size={11} />
              ) : (
                <ShieldAlert size={11} />
              )}{" "}
              {profile.verified ? "Verified agent" : "Unverified wallet"}
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-[-.03em] sm:text-5xl">
            {profile.name.toUpperCase()}
          </h1>
          <p className="mt-4 break-all font-mono text-xs text-muted">
            {profile.address}
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-muted">
            Generated on demand from live Robinhood Chain explorer and market
            APIs. No account, registration, or wallet connection was used.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.registeredAgent && (
            <Link
              href={`/agent/${profile.registeredAgent.slug}`}
              className="btn btn-primary"
            >
              Verified profile
            </Link>
          )}
          <a
            href={`https://robinhoodchain.blockscout.com/address/${profile.address}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            Blockscout <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
      {!!profile.apiWarnings.length && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-xs text-warning">
          Partial live response: {profile.apiWarnings.join(", ")} could not be
          refreshed. Available endpoint data is still shown below.
        </div>
      )}
      <div className="card overflow-hidden">
        <MetricStrip className="grid-cols-2 md:grid-cols-4 xl:grid-cols-8" items={metrics} />
      </div>
      <ScrollReveal className="mt-6 grid gap-5 md:grid-cols-3">
        <Info
          icon={<Activity size={16} />}
          label="Last API activity"
          value={
            profile.lastActivity
              ? new Date(profile.lastActivity).toLocaleString("en-US", {
                  timeZone: "UTC",
                }) + " UTC"
              : "No activity"
          }
        />
        <Info
          icon={<Database size={16} />}
          label="Data coverage"
          value={`${profile.counters.loadedTokenTransfers} of ${profile.counters.tokenTransfers.toLocaleString()} transfers loaded`}
        />
        <Info
          icon={<Eye size={16} />}
          label="Attribution"
          value={
            profile.verified
              ? "Owner-signed agent"
              : "Public wallet · AI control unknown"
          }
        />
      </ScrollReveal>
      <section className="mt-14">
        <div className="flex items-end justify-between pb-4">
          <div>
            <span className="eyebrow">API token balances</span>
            <h2 className="mt-2 text-2xl font-black tracking-[-.02em]">Live holdings</h2>
          </div>
          <WalletCards className="text-muted" />
        </div>
        {profile.holdings.length ? (
          <ScrollReveal className="card grid gap-3 p-4 sm:p-6">
            {profile.holdings.map((holding) => (
              <DataRow
                key={holding.tokenAddress}
                href={`https://robinhoodchain.blockscout.com/token/${holding.tokenAddress}`}
                external
                icon={holding.symbol.slice(0, 4)}
                iconTone="accent"
                title={holding.symbol}
                subtitle={`${holding.name} · ${holding.kind} · ${holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} qty`}
                trailing={holding.priceUsd ? usd(holding.valueUsd) : "—"}
                trailingSub={holding.priceUsd ? `${usd(holding.priceUsd)}/unit` : "Price unavailable"}
              />
            ))}
          </ScrollReveal>
        ) : (
          <p className="card py-10 text-center text-muted">
            No ERC-20 balances were returned for this address.
          </p>
        )}
      </section>
      <section className="mt-14">
        <div className="pb-4">
          <span className="eyebrow">USDG ↔ canonical Stock Token flows</span>
          <h2 className="mt-2 text-2xl font-black tracking-[-.02em]">Observed executions</h2>
        </div>
        {profile.recentTrades.length ? (
          <ScrollReveal className="card grid gap-3 p-4 sm:p-6">
            {profile.recentTrades.map((trade) => (
              <DataRow
                key={`${trade.txHash}-${trade.symbol}-${trade.side}`}
                href={`https://robinhoodchain.blockscout.com/tx/${trade.txHash}`}
                external
                iconTone={trade.side === "buy" ? "positive" : "negative"}
                icon={trade.side === "buy" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                title={`${trade.side.toUpperCase()} ${trade.symbol}`}
                subtitle={new Date(trade.tradedAt).toLocaleString("en-US", { timeZone: "UTC" }) + " UTC"}
                trailing={usd(trade.notionalUsd)}
                trailingSub={`${usd(trade.priceUsd)}/unit · fee ${usd(trade.feeUsd)}`}
              />
            ))}
          </ScrollReveal>
        ) : (
          <p className="card py-10 text-center text-muted">
            No qualifying Stock Token/USDG executions were found in the loaded
            API window.
          </p>
        )}
      </section>
      <section className="mt-14">
        <div className="pb-4">
          <span className="eyebrow">Explorer transaction endpoint</span>
          <h2 className="mt-2 text-2xl font-black tracking-[-.02em]">Raw activity</h2>
        </div>
        <ScrollReveal className="card grid gap-3 p-4 sm:p-6">
          {profile.recentTransactions.slice(0, 20).map((transaction) => (
            <DataRow
              key={transaction.hash}
              href={`https://robinhoodchain.blockscout.com/tx/${transaction.hash}`}
              external
              iconTone={transaction.status === "success" ? "positive" : "negative"}
              icon={compactAddress(transaction.hash).slice(0, 4)}
              title={transaction.method ?? "transfer"}
              subtitle={`${new Date(transaction.timestamp).toLocaleString("en-US", { timeZone: "UTC" })} UTC · block ${transaction.blockNumber}`}
              trailing={<span className={transaction.status === "success" ? "positive" : "negative"}>{transaction.status.toUpperCase()}</span>}
              trailingSub={compactAddress(transaction.hash)}
            />
          ))}
        </ScrollReveal>
      </section>
      <div className="mt-14">
        <AddressLookup compact />
      </div>
      <p className="mt-6 text-xs leading-5 text-muted">
        <ShieldAlert className="mr-1 inline" size={12} /> Observed P&amp;L is
        reconstructed only from the API history window and is not an identity
        claim or investment advice. Unknown acquisition lots are valued
        conservatively at disposal price.{" "}
        <Link href="/methodology" className="text-brand">
          Methodology
        </Link>
        .
      </p>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="eyebrow text-[9px]">{label}</span>
      </div>
      <p className="mt-3 text-sm font-bold">{value}</p>
    </div>
  );
}

function WalletLoading({address}:{address:string}) {
  return <div className="container py-12"><span className="badge badge-accent">Querying live APIs</span><h1 className="mt-4 text-4xl font-black tracking-[-.03em] sm:text-5xl">Building wallet profile</h1><p className="mt-4 font-mono text-xs text-muted">{address}</p><div className="mt-10 h-1 overflow-hidden rounded-full bg-surface-2"><div className="h-full w-1/3 animate-pulse rounded-full bg-brand"/></div><div className="mt-6 grid gap-5 md:grid-cols-3">{["Transactions","Token balances","Stock Token trades"].map(label=><div key={label} className="card h-32 animate-pulse p-5"><span className="eyebrow">{label}</span><p className="mt-5 text-sm text-muted">Fetching from Blockscout and Robinhood…</p></div>)}</div></div>;
}
