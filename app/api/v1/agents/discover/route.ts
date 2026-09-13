import { ok } from "@/lib/api/response";
import { getDiscoveredWallets } from "@/lib/data/wallet-profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const wallets = await getDiscoveredWallets();
  return ok(
    wallets.map((wallet) => ({
      ...wallet,
      profileUrl: `/api/v1/agents/${wallet.address}`,
      battleIdentifier: wallet.address,
      identityStatus: "unverified_observed_wallet" as const,
    })),
    {
      count: wallets.length,
      source: "Blockscout canonical Stock Token transfers",
      methodology:
        "Active externally-owned wallets are discovered from AAPL, NVDA, TSLA, and MSFT token transfers. This does not prove AI control.",
    },
  );
}
