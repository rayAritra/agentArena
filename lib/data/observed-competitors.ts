import "server-only";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import {
  getDiscoveredWallets,
  getPublicWalletProfile,
} from "@/lib/data/wallet-profile";
type Sql = NeonQueryFunction<false, false>;
const slugFor = (address: string) =>
  `observed-${address.slice(2, 10).toLowerCase()}`;
export async function ensureObservedCompetitor(sql: Sql, address: string) {
  const wallet = address.toLowerCase(),
    existing = (await sql.query(
      "select a.id,a.slug,a.name,w.address from agents a join agent_wallets w on w.agent_id=a.id where w.address=$1 limit 1",
      [wallet],
    )) as Array<{ id: string; slug: string; name: string; address: string }>;
  if (existing[0]) return existing[0];
  const profile = await getPublicWalletProfile(wallet),
    capital = Math.max(0, profile.metrics.portfolioValueUsd),
    lastBlock = [...profile.recentTransactions, ...profile.recentTrades]
      .reduce(
        (max, x) => (BigInt(x.blockNumber) > max ? BigInt(x.blockNumber) : max),
        0n,
      )
      .toString();
  await sql.query(
    "insert into profiles(id,display_name) values('system:blockscout','Blockscout observed wallets') on conflict(id) do nothing",
  );
  const rows = (await sql.query(
    "with a as(insert into agents(owner_id,slug,name,description,strategy,model,starting_capital,identity_type,data_source) values('system:blockscout',$1,$2,$3,'Observed Stock Token activity','Unverified wallet',$4,'observed_wallet','Blockscout + Robinhood RHJ') on conflict(slug) do update set updated_at=now() returning id,slug,name),w as(insert into agent_wallets(agent_id,address,last_synced_block) select id,$5,$6 from a on conflict(address) do nothing) select * from a",
    [
      slugFor(wallet),
      `OBSERVED ${wallet.slice(2, 6).toUpperCase()}…${wallet.slice(-4).toUpperCase()}`,
      `Active wallet discovered from canonical Stock Token transfers. AI control is not verified.`,
      capital,
      wallet,
      lastBlock,
    ],
  )) as Array<{ id: string; slug: string; name: string }>;
  const agent = rows[0];
  await sql.query(
    "insert into agent_metrics(agent_id,portfolio_value_usd,realized_pnl_usd,unrealized_pnl_usd,win_rate,trade_count,volume_usd) values($1,$2,$3,$4,$5,$6,$7) on conflict(agent_id) do update set portfolio_value_usd=excluded.portfolio_value_usd,realized_pnl_usd=excluded.realized_pnl_usd,unrealized_pnl_usd=excluded.unrealized_pnl_usd,win_rate=excluded.win_rate,trade_count=excluded.trade_count,volume_usd=excluded.volume_usd,updated_at=now()",
    [
      agent.id,
      capital,
      profile.metrics.observedRealizedPnlUsd,
      profile.metrics.observedUnrealizedPnlUsd,
      profile.metrics.winRate,
      profile.metrics.classifiedTrades,
      profile.metrics.observedVolumeUsd,
    ],
  );
  await sql.query(
    "insert into portfolio_snapshots(agent_id,equity_usd,realized_pnl_usd,unrealized_pnl_usd) values($1,$2,$3,$4)",
    [
      agent.id,
      capital,
      profile.metrics.observedRealizedPnlUsd,
      profile.metrics.observedUnrealizedPnlUsd,
    ],
  );
  return { ...agent, address: wallet };
}
export async function seedObservedCompetitors(sql: Sql, limit = 8) {
  const current = (await sql.query(
    "select count(*) count from agents where identity_type='observed_wallet'",
  )) as Array<{ count: string }>;
  const needed = Math.max(0, limit - Number(current[0]?.count ?? 0));
  if (!needed) return { created: 0 };
  const discovered = (await getDiscoveredWallets()).slice(0, needed),
    results = await Promise.allSettled(
      discovered.map((x) => ensureObservedCompetitor(sql, x.address)),
    );
  return {
    created: results.filter((x) => x.status === "fulfilled").length,
    failed: results.filter((x) => x.status === "rejected").length,
  };
}
