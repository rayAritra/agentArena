import { Hero } from "@/components/home/hero";
import { ActivityTape, AgentMarketplace, CtaBand, FeatureGrid, MarketAndBattle, StatStrip, TrustPanel, WalletDemo } from "@/components/home/sections";
import { ScrollProgress } from "@/components/home/scroll-progress";
import { Ticker } from "@/components/arena/ticker";
import { getActivity, getAgents, getBattles, getStockTokens } from "@/lib/data/repository";
import { getDiscoveredWallets } from "@/lib/data/wallet-profile";
import { summarizeAgents } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [agents, activity, tokens, battles, discovered] = await Promise.all([getAgents(), getActivity(), getStockTokens(), getBattles(), getDiscoveredWallets().catch(() => [])]);
  const stats = summarizeAgents(agents);

  return (
    <>
      <ScrollProgress />
      <Hero stats={stats} />
      {!!agents.length && <Ticker agents={agents} />}
      <StatStrip stats={stats} />
      <FeatureGrid />
      <TrustPanel />
      <AgentMarketplace agents={agents} />
      <WalletDemo discovered={discovered} />
      <MarketAndBattle tokens={tokens} battles={battles} />
      <ActivityTape activity={activity} />
      <CtaBand />
    </>
  );
}
