import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { robinhoodChain } from "@/lib/blockchain/chain";
import { env } from "@/lib/env";
import { getSql } from "@/lib/neon/db";
import { getLiveStockTokens } from "@/lib/prices/robinhood";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const chain = await createPublicClient({ chain: robinhoodChain, transport: http(env.ROBINHOOD_CHAIN_RPC_URL, { timeout: 8_000 }) }).getBlockNumber().then((block) => ({ ok: true, block: block.toString() })).catch(() => ({ ok: false, block: null }));
  const prices = await getLiveStockTokens(["AAPL"]).then((rows) => ({ ok: true, updatedAt: rows[0]?.updatedAt ?? null })).catch(() => ({ ok: false, updatedAt: null }));
  const key = env.BLOCKSCOUT_API_KEY ? `?apikey=${encodeURIComponent(env.BLOCKSCOUT_API_KEY)}` : "";
  const blockscout = await fetch(`${env.BLOCKSCOUT_API_URL}/stats${key}`, { headers: { accept: "application/json", "user-agent": "AgentArena/1.0" }, signal: AbortSignal.timeout(8_000), cache: "no-store" }).then((response) => ({ ok: response.ok && (response.headers.get("content-type") ?? "").includes("application/json"), status: response.status })).catch(() => ({ ok: false, status: 0 }));
  const sql = getSql();
  const database = sql ? await sql.query("select 1 as ok").then(() => ({ ok: true, configured: true })).catch(() => ({ ok: false, configured: true })) : { ok: false, configured: false };
  const neonAuth = { ok: !!env.NEON_AUTH_BASE_URL && !!env.NEON_AUTH_COOKIE_SECRET, configured: !!env.NEON_AUTH_BASE_URL };
  const liveAgents = database.ok && process.env.DEMO_MODE !== "true";
  const fullyOperational = chain.ok && prices.ok && blockscout.ok && liveAgents && neonAuth.ok;
  return NextResponse.json({ status: fullyOperational ? "operational" : "degraded", checkedAt, mode: liveAgents ? "live" : "demo-agents", upstreams: { robinhoodChain: chain, robinhoodStockTokens: prices, blockscout, database, neonAuth }, data: { stockTokens: "live", agents: liveAgents ? "live" : "demo", leaderboard: liveAgents ? "live" : "demo", activity: liveAgents ? "live" : "demo", battles: liveAgents ? "live" : "demo" } }, { status: chain.ok && prices.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
