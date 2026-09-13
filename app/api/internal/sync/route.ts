import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { BlockscoutClient } from "@/lib/blockchain/blockscout";
import { normalizeTransactions } from "@/lib/blockchain/normalize";
import { env, isDemoMode } from "@/lib/env";
import { getSql } from "@/lib/neon/db";

function authorized(value: string | null) {
  if (!env.CRON_SECRET || !value) return false;
  const provided = Buffer.from(value.replace(/^Bearer /, ""));
  const expected = Buffer.from(env.CRON_SECRET);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  if (!authorized(request.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isDemoMode) return NextResponse.json({ mode: "demo", processed: 0 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  try {
    const wallets = await sql.query("select id,address,last_synced_block from agent_wallets where verified_at is not null") as Array<{ id: string; address: string; last_synced_block: string | null }>;
    const client = new BlockscoutClient();
    let processed = 0;
    for (const wallet of wallets) {
      const transactions = (await client.getWalletTransactions(wallet.address)).filter((transaction) => transaction.blockNumber > BigInt(wallet.last_synced_block ?? 0));
      const events = normalizeTransactions(wallet.address, transactions);
      for (const event of events) {
        await sql.query(`insert into transactions (wallet_id,tx_hash,block_number,event_type,payload,block_timestamp) values ($1,$2,$3,$4,$5::jsonb,$6) on conflict (wallet_id,tx_hash,log_index,event_type) do nothing`, [wallet.id, event.txHash, event.blockNumber.toString(), event.type, JSON.stringify({ valueWei: event.valueWei.toString(), feeWei: event.feeWei.toString(), counterparty: event.counterparty }), event.timestamp.toISOString()]);
      }
      if (events.length) {
        await sql.query("update agent_wallets set last_synced_block=$1 where id=$2", [events.at(-1)!.blockNumber.toString(), wallet.id]);
        processed += events.length;
      }
    }
    return NextResponse.json({ processed, wallets: wallets.length });
  } catch {
    return NextResponse.json({ error: "Synchronization failed safely; retry later" }, { status: 503 });
  }
}
