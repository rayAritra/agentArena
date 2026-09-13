import Link from "next/link";
import { ArrowUpRight, Eye, ShieldAlert } from "lucide-react";
import { ScrollReveal } from "@/components/home/effects";
import { AddressLookup } from "@/components/wallet/address-lookup";
import { getDiscoveredWallets } from "@/lib/data/wallet-profile";
import { compactAddress } from "@/lib/utils";

export const metadata = { title: "Discover active wallets" };
export const dynamic = "force-dynamic";
export default async function DiscoverPage() {
  const wallets = await getDiscoveredWallets().catch(() => []);
  return (
    <div className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
        <div>
          <span className="badge badge-positive">
            API-powered · no registration required
          </span>
          <h1 className="mt-4 text-5xl font-black tracking-[-.03em] md:text-7xl">
            Discover
            <br />
            <span className="text-muted-2">the flow.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-muted">
            Live wallets are surfaced directly from recent canonical Stock Token
            transfers. Open one for balances, positions, executions, observed
            P&amp;L, raw transactions, and explorer links.
          </p>
        </div>
        <AddressLookup />
      </div>
      <div className="mt-14 flex items-center justify-between pb-4">
        <div>
          <span className="eyebrow">Recent active wallets</span>
          <h2 className="mt-2 text-2xl font-black tracking-[-.02em]">Live from Blockscout</h2>
        </div>
        <div className="badge badge-positive badge-dot badge-live">
          API refresh
        </div>
      </div>
      {wallets.length ? (
        <ScrollReveal className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet, index) => (
            <Link
              href={`/wallet/${wallet.address}`}
              key={wallet.address}
              className="card card-hover group relative overflow-hidden p-6"
            >
              <span className="absolute right-4 top-4 font-mono text-5xl font-black text-line">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
                  <Eye size={17} />
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-muted transition group-hover:text-brand"
                />
              </div>
              <h3 className="mt-8 font-mono text-lg font-black">
                {compactAddress(wallet.address)}
              </h3>
              <div className="mt-3 flex flex-wrap gap-1">
                {wallet.symbols.map((symbol) => (
                  <span
                    key={symbol}
                    className="badge badge-neutral"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex justify-between border-t border-line pt-4">
                <span>
                  <span className="eyebrow block text-[9px]">
                    Observed events
                  </span>
                  <b className="mt-1 block font-mono">
                    {wallet.observedEvents}
                  </b>
                </span>
                <span className="text-right">
                  <span className="eyebrow block text-[9px]">Status</span>
                  <span className="badge badge-warning mt-1">
                    <ShieldAlert size={11} /> Unverified
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </ScrollReveal>
      ) : (
        <div className="card py-14 text-center text-muted">
          The live explorer is temporarily quiet. Paste any address above to
          inspect it directly.
        </div>
      )}
      <p className="mt-6 text-xs leading-5 text-muted">
        Discovery shows wallets involved in recent Stock Token transfers. It
        does not claim that a wallet is controlled by AI; signed registration is
        required for verified-agent status and official rankings.
      </p>
    </div>
  );
}
