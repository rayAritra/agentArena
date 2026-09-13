import "server-only";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { calculateFifo, unrealizedPnl, type Trade } from "@/lib/pnl/fifo";
import { formatFixed, parseFixed } from "@/lib/pnl/decimal";

const MONEY_SCALE = 6;
const QUANTITY_SCALE = 1_000_000n;
type Sql = NeonQueryFunction<false, false>;
type TradeRow = { id: string; asset_address: string; symbol: string; side: "buy" | "sell"; quantity: string; price_usd: string; fee_usd: string; traded_at: string };

function percent(numerator: bigint, denominator: bigint) { return denominator === 0n ? "0" : formatFixed(numerator * 100_000_000n / denominator, 6); }

export async function rebuildAgentAccounting(sql: Sql, agentId: string, currentPrices: Map<string, string>) {
  const agents = await sql.query("select starting_capital from agents where id=$1 limit 1", [agentId]) as Array<{ starting_capital: string }>;
  if (!agents[0]) throw new Error("Agent not found during accounting rebuild");
  const rows = await sql.query("select id,asset_address,symbol,side,quantity,price_usd,fee_usd,traded_at from normalized_trades where agent_id=$1 and price_usd is not null order by traded_at,id", [agentId]) as TradeRow[];
  const trades: Trade[] = rows.map((row) => ({ id: row.id, asset: row.asset_address.toLowerCase(), side: row.side, quantity: parseFixed(row.quantity, 6), unitPriceMicros: parseFixed(row.price_usd, MONEY_SCALE), feeMicros: parseFixed(row.fee_usd, MONEY_SCALE), timestamp: new Date(row.traded_at) }));
  const accounting = calculateFifo(trades, QUANTITY_SCALE, true);
  const symbols = new Map(rows.map((row) => [row.asset_address.toLowerCase(), row.symbol]));
  let unrealized = 0n;
  let volume = 0n;
  for (const trade of trades) volume += trade.quantity * trade.unitPriceMicros / QUANTITY_SCALE;
  const positionRows = [...accounting.positions.values()].filter((position) => position.quantity > 0n).map((position) => {
    const currentPrice = parseFixed(currentPrices.get(position.asset) ?? "0", MONEY_SCALE);
    const value = position.quantity * currentPrice / QUANTITY_SCALE;
    const pending = unrealizedPnl(position, currentPrice, QUANTITY_SCALE);
    unrealized += pending;
    return { asset: position.asset, symbol: symbols.get(position.asset) ?? "UNKNOWN", quantity: formatFixed(position.quantity, 6), costBasis: formatFixed(position.costBasisMicros, MONEY_SCALE), realized: formatFixed(position.realizedPnlMicros, MONEY_SCALE), currentPrice: formatFixed(currentPrice, MONEY_SCALE), marketValue: formatFixed(value, MONEY_SCALE), unrealized: formatFixed(pending, MONEY_SCALE) };
  });
  const outcomeById = new Map(accounting.outcomes.map((outcome) => [outcome.tradeId, outcome]));
  const lotRows=[...accounting.positions.values()].flatMap(position=>position.lots.map(lot=>({asset:position.asset,symbol:symbols.get(position.asset)??"UNKNOWN",sourceTradeId:lot.sourceTradeId.startsWith("inferred:")?null:lot.sourceTradeId,quantity:formatFixed(lot.quantity,6),unitCost:formatFixed(lot.unitCostMicros,MONEY_SCALE),openedAt:rows.find(row=>row.id===lot.sourceTradeId)?.traded_at??new Date().toISOString()})));
  const wins = accounting.outcomes.filter((outcome) => outcome.realizedPnlMicros > 0n);
  const losses = accounting.outcomes.filter((outcome) => outcome.realizedPnlMicros < 0n);
  const grossProfit = wins.reduce((total, outcome) => total + outcome.realizedPnlMicros, 0n);
  const grossLoss = losses.reduce((total, outcome) => total - outcome.realizedPnlMicros, 0n);
  const startingCapital = parseFixed(agents[0].starting_capital, MONEY_SCALE);
  const totalPnl = accounting.realizedPnlMicros + unrealized;
  const equity = startingCapital + totalPnl;
  const prior = await sql.query("select equity_usd,captured_at from portfolio_snapshots where agent_id=$1 order by captured_at", [agentId]) as Array<{ equity_usd: string; captured_at: string }>;
  const equityAt = (milliseconds: number) => { const cutoff = Date.now() - milliseconds; const match = [...prior].reverse().find((row) => new Date(row.captured_at).getTime() <= cutoff); return match ? equity - parseFixed(match.equity_usd, MONEY_SCALE) : 0n; };
  let peak = startingCapital;
  let maxDrawdown = 0n;
  for (const snapshot of [...prior, { equity_usd: formatFixed(equity, MONEY_SCALE), captured_at: new Date().toISOString() }]) { const value = parseFixed(snapshot.equity_usd, MONEY_SCALE); if (value > peak) peak = value; if (peak > 0n) { const drawdown = (value - peak) * 100_000_000n / peak; if (drawdown < maxDrawdown) maxDrawdown = drawdown; } }

  const battleRows = await sql.query("select b.id from battles b join battle_participants bp on bp.battle_id=b.id where bp.agent_id=$1 and b.starts_at<=now() and b.ends_at>now()", [agentId]) as Array<{ id: string }>;
  const queries = [sql`delete from positions where agent_id=${agentId}`,sql`delete from position_lots where agent_id=${agentId}`];
  for (const position of positionRows) queries.push(sql`insert into positions (agent_id,asset_address,symbol,quantity,cost_basis_usd,realized_pnl_usd,current_price_usd,market_value_usd,unrealized_pnl_usd,updated_at) values (${agentId},${position.asset},${position.symbol},${position.quantity},${position.costBasis},${position.realized},${position.currentPrice},${position.marketValue},${position.unrealized},now())`);
  for(const lot of lotRows)queries.push(sql`insert into position_lots(agent_id,asset_address,symbol,source_trade_id,quantity,unit_cost_usd,opened_at) values(${agentId},${lot.asset},${lot.symbol},${lot.sourceTradeId},${lot.quantity},${lot.unitCost},${lot.openedAt})`);
  for (const [tradeId, outcome] of outcomeById) queries.push(sql`update normalized_trades set cost_basis_usd=${formatFixed(outcome.costBasisMicros,MONEY_SCALE)},proceeds_usd=${formatFixed(outcome.proceedsMicros,MONEY_SCALE)},realized_pnl_usd=${formatFixed(outcome.realizedPnlMicros,MONEY_SCALE)} where id=${tradeId}`);
  queries.push(sql`insert into agent_metrics (agent_id,portfolio_value_usd,realized_pnl_usd,unrealized_pnl_usd,roi,pnl_24h,pnl_7d,pnl_30d,win_rate,trade_count,volume_usd,best_trade_usd,worst_trade_usd,max_drawdown,profit_factor,average_win_usd,average_loss_usd,updated_at) values (${agentId},${formatFixed(equity,MONEY_SCALE)},${formatFixed(accounting.realizedPnlMicros,MONEY_SCALE)},${formatFixed(unrealized,MONEY_SCALE)},${percent(totalPnl,startingCapital)},${formatFixed(equityAt(86_400_000),MONEY_SCALE)},${formatFixed(equityAt(604_800_000),MONEY_SCALE)},${formatFixed(equityAt(2_592_000_000),MONEY_SCALE)},${accounting.outcomes.length?formatFixed(BigInt(wins.length)*100_000_000n/BigInt(accounting.outcomes.length),6):"0"},${rows.length},${formatFixed(volume,MONEY_SCALE)},${formatFixed(accounting.outcomes.reduce((best,outcome)=>outcome.realizedPnlMicros>best?outcome.realizedPnlMicros:best,0n),MONEY_SCALE)},${formatFixed(accounting.outcomes.reduce((worst,outcome)=>outcome.realizedPnlMicros<worst?outcome.realizedPnlMicros:worst,0n),MONEY_SCALE)},${formatFixed(maxDrawdown,6)},${grossLoss?formatFixed(grossProfit*1_000_000n/grossLoss,6):grossProfit?"999":"0"},${wins.length?formatFixed(grossProfit/BigInt(wins.length),MONEY_SCALE):"0"},${losses.length?formatFixed(-grossLoss/BigInt(losses.length),MONEY_SCALE):"0"},now()) on conflict (agent_id) do update set portfolio_value_usd=excluded.portfolio_value_usd,realized_pnl_usd=excluded.realized_pnl_usd,unrealized_pnl_usd=excluded.unrealized_pnl_usd,roi=excluded.roi,pnl_24h=excluded.pnl_24h,pnl_7d=excluded.pnl_7d,pnl_30d=excluded.pnl_30d,win_rate=excluded.win_rate,trade_count=excluded.trade_count,volume_usd=excluded.volume_usd,best_trade_usd=excluded.best_trade_usd,worst_trade_usd=excluded.worst_trade_usd,max_drawdown=excluded.max_drawdown,profit_factor=excluded.profit_factor,average_win_usd=excluded.average_win_usd,average_loss_usd=excluded.average_loss_usd,updated_at=now()`);
  queries.push(sql`insert into portfolio_snapshots (agent_id,equity_usd,realized_pnl_usd,unrealized_pnl_usd) values (${agentId},${formatFixed(equity,MONEY_SCALE)},${formatFixed(accounting.realizedPnlMicros,MONEY_SCALE)},${formatFixed(unrealized,MONEY_SCALE)})`);
  queries.push(sql`insert into agent_metric_snapshots(agent_id,portfolio_value_usd,realized_pnl_usd,unrealized_pnl_usd,roi,win_rate,max_drawdown,trade_count,volume_usd) values(${agentId},${formatFixed(equity,MONEY_SCALE)},${formatFixed(accounting.realizedPnlMicros,MONEY_SCALE)},${formatFixed(unrealized,MONEY_SCALE)},${percent(totalPnl,startingCapital)},${accounting.outcomes.length?formatFixed(BigInt(wins.length)*100_000_000n/BigInt(accounting.outcomes.length),6):"0"},${formatFixed(maxDrawdown,6)},${rows.length},${formatFixed(volume,MONEY_SCALE)})`);
  for (const battle of battleRows) queries.push(sql`insert into battle_snapshots (battle_id,agent_id,equity_usd,return_pct) values (${battle.id},${agentId},${formatFixed(equity,MONEY_SCALE)},${percent(totalPnl,startingCapital)})`);
  await sql.transaction(queries);
  return { trades: rows.length, positions: positionRows.length, equityUsd: formatFixed(equity, MONEY_SCALE), realizedPnlUsd: formatFixed(accounting.realizedPnlMicros, MONEY_SCALE), unrealizedPnlUsd: formatFixed(unrealized, MONEY_SCALE) };
}
