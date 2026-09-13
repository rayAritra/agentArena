import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { BlockscoutClient, type ChainTransaction, type TokenTransfer } from "@/lib/blockchain/blockscout";
import { classifyStockTokenTrades } from "@/lib/blockchain/classify";
import { normalizeTransactions } from "@/lib/blockchain/normalize";
import { env, isDemoMode } from "@/lib/env";
import { getSql } from "@/lib/neon/db";
import { formatFixed, parseFixed } from "@/lib/pnl/decimal";
import { rebuildAgentAccounting } from "@/lib/pnl/rebuild";
import { getLiveStockTokens } from "@/lib/prices/robinhood";

export const dynamic = "force-dynamic";
const REORG_OVERLAP = 20n;
type WalletRow = { id: string; agent_id: string; address: string; last_synced_block: string | null };

function authorized(value: string | null) {
  if (!env.CRON_SECRET || !value) return false;
  const provided = Buffer.from(value.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(env.CRON_SECRET);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function feeUsd(transaction: ChainTransaction | undefined) {
  if (!transaction || transaction.feeWei === 0n || !transaction.exchangeRateUsd) return "0";
  return formatFixed(transaction.feeWei * parseFixed(transaction.exchangeRateUsd, 6) / 1_000_000_000_000_000_000n, 6);
}

function transferPayload(transfer: TokenTransfer) {
  return JSON.stringify({ tokenAddress: transfer.tokenAddress.toLowerCase(), symbol: transfer.symbol, decimals: transfer.decimals, value: transfer.value.toString(), from: transfer.from.toLowerCase(), to: transfer.to.toLowerCase() });
}

export async function POST(request: Request) {
  if (!authorized(request.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isDemoMode) return NextResponse.json({ mode: "demo", processed: 0, trades: 0 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  try {
    const [walletRows, tokens] = await Promise.all([
      sql.query("select w.id,w.agent_id,w.address,w.last_synced_block from agent_wallets w join agents a on a.id=w.agent_id where w.verified_at is not null and a.verified_at is not null"),
      getLiveStockTokens(),
    ]);
    const wallets = walletRows as WalletRow[];
    const assets = tokens.map((token) => ({ address: token.contractAddress.toLowerCase(), symbol: token.symbol }));
    const currentPrices = new Map(tokens.map((token) => [token.contractAddress.toLowerCase(), String(token.reference)]));
    const marketQueries=[];
    for (const token of tokens) {
      marketQueries.push(sql`insert into stock_tokens (symbol,asset_address,reference_symbol,active) values (${token.symbol},${token.contractAddress.toLowerCase()},${token.symbol},true) on conflict (symbol) do update set asset_address=excluded.asset_address,reference_symbol=excluded.reference_symbol,active=true`);
      marketQueries.push(sql`insert into asset_prices (asset_address,symbol,price_usd,source,observed_at) values (${token.contractAddress.toLowerCase()},${token.symbol},${String(token.reference)},${"Robinhood RHJ reference"},${token.updatedAt}) on conflict (asset_address,source,observed_at) do update set price_usd=excluded.price_usd`);
    }
    await sql.transaction(marketQueries);

    const client = new BlockscoutClient();
    const results: Array<Record<string, unknown>> = [];
    let processed = 0;
    let tradeCount = 0;
    for (const wallet of wallets) {
      try {
        const previous = BigInt(wallet.last_synced_block ?? "0");
        const afterBlock = previous > REORG_OVERLAP ? previous - REORG_OVERLAP : 0n;
        const [chainTransactions, transfers] = await Promise.all([client.getWalletTransactions(wallet.address, afterBlock), client.getWalletTokenTransfers(wallet.address, afterBlock)]);
        const normalized = normalizeTransactions(wallet.address, chainTransactions);
        const trades = classifyStockTokenTrades(wallet.address, transfers, assets);
        const txByHash = new Map(chainTransactions.map((transaction) => [transaction.hash.toLowerCase(), transaction]));

        await sql.query("delete from transactions where wallet_id=$1 and block_number>$2", [wallet.id, afterBlock.toString()]);
        for (const event of normalized) {
          await sql.query("insert into transactions (wallet_id,tx_hash,block_number,log_index,event_type,payload,block_timestamp) values ($1,$2,$3,0,$4,$5::jsonb,$6) on conflict (wallet_id,tx_hash,log_index,event_type) do update set block_number=excluded.block_number,payload=excluded.payload,block_timestamp=excluded.block_timestamp", [wallet.id, event.txHash.toLowerCase(), event.blockNumber.toString(), event.type, JSON.stringify({ valueWei: event.valueWei.toString(), feeWei: event.feeWei.toString(), counterparty: event.counterparty }), event.timestamp.toISOString()]);
        }
        for (const transfer of transfers) {
          const direction = transfer.to.toLowerCase() === wallet.address.toLowerCase() ? "in" : "out";
          await sql.query("insert into transactions (wallet_id,tx_hash,block_number,log_index,event_type,payload,block_timestamp) values ($1,$2,$3,$4,$5,$6::jsonb,$7) on conflict (wallet_id,tx_hash,log_index,event_type) do update set block_number=excluded.block_number,payload=excluded.payload,block_timestamp=excluded.block_timestamp", [wallet.id, transfer.txHash.toLowerCase(), transfer.blockNumber.toString(), transfer.logIndex, `erc20_transfer_${direction}`, transferPayload(transfer), transfer.timestamp.toISOString()]);
        }
        for (const trade of trades) {
          const eventType = trade.side === "buy" ? "erc20_transfer_in" : "erc20_transfer_out";
          const sourceRows = await sql.query("select id from transactions where wallet_id=$1 and tx_hash=$2 and log_index=$3 and event_type=$4 limit 1", [wallet.id, trade.txHash.toLowerCase(), trade.sourceLogIndex, eventType]) as Array<{ id: string }>;
          if (!sourceRows[0]) throw new Error(`Source transfer missing for ${trade.txHash}`);
          await sql.query("insert into normalized_trades (transaction_id,agent_id,side,asset_address,symbol,quantity,price_usd,quote_amount_usd,fee_usd,traded_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (transaction_id) do update set side=excluded.side,asset_address=excluded.asset_address,symbol=excluded.symbol,quantity=excluded.quantity,price_usd=excluded.price_usd,quote_amount_usd=excluded.quote_amount_usd,fee_usd=excluded.fee_usd,traded_at=excluded.traded_at", [sourceRows[0].id, wallet.agent_id, trade.side, trade.assetAddress, trade.symbol, trade.quantity, trade.priceUsd, trade.quoteAmountUsd, feeUsd(txByHash.get(trade.txHash.toLowerCase())), trade.tradedAt.toISOString()]);
        }

        const latestBlock = [...chainTransactions.map((item) => item.blockNumber), ...transfers.map((item) => item.blockNumber)].reduce((latest, value) => value > latest ? value : latest, previous);
        if (latestBlock > previous) await sql.query("update agent_wallets set last_synced_block=$1 where id=$2", [latestBlock.toString(), wallet.id]);
        const accounting = await rebuildAgentAccounting(sql, wallet.agent_id, currentPrices);
        processed += normalized.length + transfers.length;
        tradeCount += trades.length;
        results.push({ wallet: wallet.address, transactions: normalized.length, tokenTransfers: transfers.length, classifiedTrades: trades.length, checkpoint: latestBlock.toString(), accounting });
      } catch (error) {
        results.push({ wallet: wallet.address, error: error instanceof Error ? error.message : "Unknown wallet synchronization failure" });
      }
    }

    await sql.query("insert into leaderboard_snapshots (agent_id,period,rank,score) select agent_id,'overall',row_number() over(order by roi desc,portfolio_value_usd desc),roi from agent_metrics where agent_id in (select id from agents where verified_at is not null)");

    const failed = results.filter((result) => "error" in result).length;
    return NextResponse.json({ mode: "live", assets: tokens.length, wallets: wallets.length, processed, trades: tradeCount, failed, results }, { status: failed === wallets.length && wallets.length > 0 ? 503 : 200 });
  } catch (error) {
    console.error("sync failed", error);
    return NextResponse.json({ error: "Synchronization failed safely; retry later" }, { status: 503 });
  }
}
