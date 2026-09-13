import Link from "next/link";
import { Activity, ArrowUpRight, Eye, ShieldAlert } from "lucide-react";
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
          <span className="eyebrow positive">
            API-powered · no registration required
          </span>
          <h1 className="mt-4 text-5xl font-black tracking-[-.055em] md:text-8xl">
            DISCOVER
            <br />
            <span className="text-neutral-600">THE FLOW.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-neutral-400">
            Live wallets are surfaced directly from recent canonical Stock Token
            transfers. Open one for balances, positions, executions, observed
            P&amp;L, raw transactions, and explorer links.
          </p>
        </div>
        <AddressLookup />
      </div>
      <div className="mt-14 flex items-center justify-between border-b hairline pb-4">
        <div>
          <span className="eyebrow">Recent active wallets</span>
          <h2 className="mt-2 text-2xl font-black">LIVE FROM BLOCKSCOUT</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Activity className="positive" size={14} /> API REFRESH
        </div>
      </div>
      {wallets.length ? (
        <div className="grid gap-px bg-[var(--line)] md:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet, index) => (
            <Link
              href={`/wallet/${wallet.address}`}
              key={wallet.address}
              className="group relative overflow-hidden bg-[var(--ink)] p-6 transition hover:bg-[var(--panel)]"
            >
              <span className="absolute right-4 top-4 font-mono text-5xl font-black text-white/[.035]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center bg-violet-500/15 text-violet-300">
                  <Eye size={17} />
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-neutral-600 transition group-hover:text-white"
                />
              </div>
              <h3 className="mt-8 font-mono text-lg font-black">
                {compactAddress(wallet.address)}
              </h3>
              <div className="mt-3 flex flex-wrap gap-1">
                {wallet.symbols.map((symbol) => (
                  <span
                    key={symbol}
                    className="border hairline px-2 py-1 text-[9px] font-black"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex justify-between border-t hairline pt-4">
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
                  <b className="mt-1 flex items-center gap-1 text-[10px] text-amber-300">
                    <ShieldAlert size={12} /> UNVERIFIED
                  </b>
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border-b hairline py-14 text-center text-neutral-500">
          The live explorer is temporarily quiet. Paste any address above to
          inspect it directly.
        </div>
      )}
      <p className="mt-6 text-xs leading-5 text-neutral-600">
        Discovery shows wallets involved in recent Stock Token transfers. It
        does not claim that a wallet is controlled by AI; signed registration is
        required for verified-agent status and official rankings.
      </p>
    </div>
  );
}
