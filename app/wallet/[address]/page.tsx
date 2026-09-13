import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  Activity,
  ArrowUpRight,
  Database,
  Eye,
  ShieldAlert,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
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
    ["Portfolio mark", usd(profile.metrics.portfolioValueUsd)],
    ["Observed P&L", usd(pnl)],
    ["Realized", usd(profile.metrics.observedRealizedPnlUsd)],
    ["Unrealized", usd(profile.metrics.observedUnrealizedPnlUsd)],
    ["Trade volume", usd(profile.metrics.observedVolumeUsd, true)],
    ["Classified trades", String(profile.metrics.classifiedTrades)],
    ["Win rate", `${profile.metrics.winRate.toFixed(1)}%`],
    ["All transfers", profile.counters.tokenTransfers.toLocaleString()],
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
        <div className="flex gap-2">
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
      <div className="card grid grid-cols-2 divide-x divide-y divide-line md:grid-cols-4 xl:grid-cols-8 xl:divide-y-0">
        {metrics.map(([label, value]) => (
          <div className="py-5 px-4" key={label}>
            <span className="eyebrow block text-[9px]">{label}</span>
            <strong
              className={`mt-2 block font-mono text-lg ${label.includes("P&L") || label === "Realized" || label === "Unrealized" ? (String(value).startsWith("-") ? "negative" : "positive") : ""}`}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
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
      </div>
      <section className="mt-14">
        <div className="flex items-end justify-between pb-4">
          <div>
            <span className="eyebrow">API token balances</span>
            <h2 className="mt-2 text-2xl font-black tracking-[-.02em]">Live holdings</h2>
          </div>
          <WalletCards className="text-muted" />
        </div>
        {profile.holdings.length ? (
          <div className="card overflow-x-auto">
            <table className="table-clean min-w-[760px]">
              <thead>
                <tr>
                  {[
                    "Asset",
                    "Type",
                    "Quantity",
                    "API price",
                    "Marked value",
                    "Contract",
                  ].map((label) => (
                    <th key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profile.holdings.map((holding) => (
                  <tr
                    className="font-mono"
                    key={holding.tokenAddress}
                  >
                    <td className="font-black">
                      {holding.symbol}
                      <span className="ml-2 font-sans text-xs font-normal text-muted">
                        {holding.name}
                      </span>
                    </td>
                    <td>{holding.kind}</td>
                    <td>
                      {holding.quantity.toLocaleString(undefined, {
                        maximumFractionDigits: 8,
                      })}
                    </td>
                    <td>
                      {holding.priceUsd ? usd(holding.priceUsd) : "Unavailable"}
                    </td>
                    <td>{holding.priceUsd ? usd(holding.valueUsd) : "—"}</td>
                    <td>
                      <a
                        className="text-brand"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://robinhoodchain.blockscout.com/token/${holding.tokenAddress}`}
                      >
                        {compactAddress(holding.tokenAddress)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="card overflow-x-auto">
            <table className="table-clean min-w-[850px]">
              <thead>
                <tr>
                  {[
                    "UTC time",
                    "Side",
                    "Asset",
                    "Quantity",
                    "Execution price",
                    "Notional",
                    "Fee",
                    "Block",
                    "Transaction",
                  ].map((label) => (
                    <th key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profile.recentTrades.map((trade) => (
                  <tr
                    className="font-mono"
                    key={`${trade.txHash}-${trade.symbol}-${trade.side}`}
                  >
                    <td>
                      {new Date(trade.tradedAt).toLocaleString("en-US", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td
                      className={trade.side === "buy" ? "positive" : "negative"}
                    >
                      {trade.side.toUpperCase()}
                    </td>
                    <td className="font-black">{trade.symbol}</td>
                    <td>{trade.quantity}</td>
                    <td>{usd(trade.priceUsd)}</td>
                    <td>{usd(trade.notionalUsd)}</td>
                    <td>{usd(trade.feeUsd)}</td>
                    <td>{trade.blockNumber}</td>
                    <td>
                      <a
                        className="text-brand"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://robinhoodchain.blockscout.com/tx/${trade.txHash}`}
                      >
                        {compactAddress(trade.txHash)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <div className="card divide-y divide-line">
          {profile.recentTransactions.slice(0, 20).map((transaction) => (
            <a
              target="_blank"
              rel="noreferrer"
              href={`https://robinhoodchain.blockscout.com/tx/${transaction.hash}`}
              key={transaction.hash}
              className="grid gap-2 px-5 py-4 text-xs transition hover:bg-surface-2 md:grid-cols-[180px_1fr_120px_100px]"
            >
              <time className="font-mono text-muted">
                {new Date(transaction.timestamp).toLocaleString("en-US", {
                  timeZone: "UTC",
                })}{" "}
                UTC
              </time>
              <span className="font-mono">
                {compactAddress(transaction.hash)} ·{" "}
                {transaction.method ?? "transfer"}
              </span>
              <span>Block {transaction.blockNumber}</span>
              <span
                className={
                  transaction.status === "success" ? "positive" : "negative"
                }
              >
                {transaction.status.toUpperCase()}
              </span>
            </a>
          ))}
        </div>
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
