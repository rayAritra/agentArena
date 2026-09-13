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
      <div className="grid gap-10 border-b hairline pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow positive">Direct API wallet profile</span>
            <span
              className={`flex items-center gap-1 px-2 py-1 text-[9px] font-black ${profile.verified ? "bg-emerald-400 text-black" : "border border-amber-400/40 text-amber-300"}`}
            >
              {profile.verified ? (
                <ShieldCheck size={11} />
              ) : (
                <ShieldAlert size={11} />
              )}{" "}
              {profile.verified ? "VERIFIED AGENT" : "UNVERIFIED WALLET"}
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">
            {profile.name.toUpperCase()}
          </h1>
          <p className="mt-4 break-all font-mono text-xs text-neutral-500">
            {profile.address}
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-neutral-400">
            Generated on demand from live Robinhood Chain explorer and market
            APIs. No account, registration, or wallet connection was used.
          </p>
        </div>
        <div className="flex gap-2">
          {profile.registeredAgent && (
            <Link
              href={`/agent/${profile.registeredAgent.slug}`}
              className="bg-white px-4 py-3 text-xs font-black text-black"
            >
              VERIFIED PROFILE
            </Link>
          )}
          <a
            href={`https://robinhoodchain.blockscout.com/address/${profile.address}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 border hairline px-4 py-3 text-xs font-black"
          >
            BLOCKSCOUT <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
      {!!profile.apiWarnings.length && (
        <div className="border-x border-b border-amber-400/30 bg-amber-400/5 px-4 py-3 text-xs text-amber-200">
          Partial live response: {profile.apiWarnings.join(", ")} could not be
          refreshed. Available endpoint data is still shown below.
        </div>
      )}
      <div className="grid grid-cols-2 border-b hairline md:grid-cols-4 xl:grid-cols-8">
        {metrics.map(([label, value]) => (
          <div className="border-r hairline py-5 pr-3" key={label}>
            <span className="eyebrow block text-[9px]">{label}</span>
            <strong
              className={`mt-2 block font-mono text-lg ${label.includes("P&L") || label === "Realized" || label === "Unrealized" ? (String(value).startsWith("-") ? "negative" : "positive") : ""}`}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-px bg-[var(--line)] md:grid-cols-3">
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
        <div className="flex items-end justify-between border-b hairline pb-4">
          <div>
            <span className="eyebrow">API token balances</span>
            <h2 className="mt-2 text-2xl font-black">LIVE HOLDINGS</h2>
          </div>
          <WalletCards className="text-neutral-600" />
        </div>
        {profile.holdings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="eyebrow text-[9px]">
                <tr>
                  {[
                    "Asset",
                    "Type",
                    "Quantity",
                    "API price",
                    "Marked value",
                    "Contract",
                  ].map((label) => (
                    <th className="py-4" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profile.holdings.map((holding) => (
                  <tr
                    className="border-t hairline font-mono"
                    key={holding.tokenAddress}
                  >
                    <td className="py-4 font-black">
                      {holding.symbol}
                      <span className="ml-2 font-sans text-xs font-normal text-neutral-600">
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
                        className="underline"
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
          <p className="border-b hairline py-10 text-center text-neutral-500">
            No ERC-20 balances were returned for this address.
          </p>
        )}
      </section>
      <section className="mt-14">
        <div className="border-b hairline pb-4">
          <span className="eyebrow">USDG ↔ canonical Stock Token flows</span>
          <h2 className="mt-2 text-2xl font-black">OBSERVED EXECUTIONS</h2>
        </div>
        {profile.recentTrades.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="eyebrow text-[9px]">
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
                    <th className="py-4" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profile.recentTrades.map((trade) => (
                  <tr
                    className="border-t hairline font-mono"
                    key={`${trade.txHash}-${trade.symbol}-${trade.side}`}
                  >
                    <td className="py-4">
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
                        className="underline"
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
          <p className="border-b hairline py-10 text-center text-neutral-500">
            No qualifying Stock Token/USDG executions were found in the loaded
            API window.
          </p>
        )}
      </section>
      <section className="mt-14">
        <div className="border-b hairline pb-4">
          <span className="eyebrow">Explorer transaction endpoint</span>
          <h2 className="mt-2 text-2xl font-black">RAW ACTIVITY</h2>
        </div>
        <div>
          {profile.recentTransactions.slice(0, 20).map((transaction) => (
            <a
              target="_blank"
              rel="noreferrer"
              href={`https://robinhoodchain.blockscout.com/tx/${transaction.hash}`}
              key={transaction.hash}
              className="grid gap-2 border-b hairline py-4 text-xs transition hover:bg-white/[.025] md:grid-cols-[180px_1fr_120px_100px]"
            >
              <time className="font-mono text-neutral-500">
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
      <p className="mt-6 text-xs leading-5 text-neutral-600">
        <ShieldAlert className="mr-1 inline" size={12} /> Observed P&amp;L is
        reconstructed only from the API history window and is not an identity
        claim or investment advice. Unknown acquisition lots are valued
        conservatively at disposal price.{" "}
        <Link href="/methodology" className="underline">
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
    <div className="bg-[var(--ink)] p-5">
      <div className="flex items-center gap-2 text-neutral-500">
        {icon}
        <span className="eyebrow text-[9px]">{label}</span>
      </div>
      <p className="mt-3 text-sm font-bold">{value}</p>
    </div>
  );
}

function WalletLoading({address}:{address:string}) {
  return <div className="container py-12"><span className="eyebrow positive">Querying live APIs</span><h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">BUILDING WALLET PROFILE</h1><p className="mt-4 font-mono text-xs text-neutral-500">{address}</p><div className="mt-10 h-1 overflow-hidden bg-white/10"><div className="h-full w-1/3 animate-pulse bg-emerald-400"/></div><div className="mt-6 grid gap-px bg-[var(--line)] md:grid-cols-3">{["TRANSACTIONS","TOKEN BALANCES","STOCK TOKEN TRADES"].map(label=><div key={label} className="h-32 animate-pulse bg-[var(--ink)] p-5"><span className="eyebrow">{label}</span><p className="mt-5 text-sm text-neutral-600">Fetching from Blockscout and Robinhood…</p></div>)}</div></div>;
}
