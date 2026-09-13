import { z } from "zod";
import { env } from "@/lib/env";

const address = z.string().regex(/^0x[\da-fA-F]{40}$/);
const addressObject = z.object({ hash: z.string() });
const pageParams = z.record(z.string(), z.unknown()).nullable().optional();
const transactionResponse = z.object({
  items: z.array(z.object({
    hash: z.string(), block_number: z.number(), timestamp: z.string(), status: z.string(), method: z.string().nullable().optional(), value: z.string(),
    from: addressObject, to: addressObject.nullable(), fee: z.object({ value: z.string() }).nullable().optional(), exchange_rate: z.string().nullable().optional(),
  })),
  next_page_params: pageParams,
});
const transferResponse = z.object({
  items: z.array(z.object({
    block_number: z.number(), timestamp: z.string(), transaction_hash: z.string(), log_index: z.number(), from: addressObject, to: addressObject,
    token: z.object({ address_hash: z.string(), symbol: z.string().nullable().optional(), decimals: z.string().nullable().optional(), type: z.string().nullable().optional() }),
    total: z.object({ value: z.string(), decimals: z.string().nullable().optional() }),
  })),
  next_page_params: pageParams,
});

export type ChainTransaction = { hash: string; blockNumber: bigint; timestamp: Date; status: "success" | "failed"; method: string | null; valueWei: bigint; from: string; to: string | null; feeWei: bigint; exchangeRateUsd?: string | null };
export type TokenTransfer = { txHash: string; blockNumber: bigint; logIndex: number; timestamp: Date; from: string; to: string; tokenAddress: string; symbol: string; decimals: number; value: bigint; tokenType: string | null };
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BlockscoutClient {
  constructor(private readonly baseUrl = env.BLOCKSCOUT_API_URL) {}

  private async request(path: string, attempt = 0): Promise<unknown> {
    const separator = path.includes("?") ? "&" : "?";
    const key = env.BLOCKSCOUT_API_KEY ? `${separator}apikey=${encodeURIComponent(env.BLOCKSCOUT_API_KEY)}` : "";
    const response = await fetch(`${this.baseUrl}${path}${key}`, { headers: { accept: "application/json", "user-agent": "AgentArena/1.0" }, signal: AbortSignal.timeout(15_000), cache: "no-store" });
    if ((response.status === 429 || response.status >= 500) && attempt < 4) { await wait(300 * 2 ** attempt); return this.request(path, attempt + 1); }
    if (!response.ok) throw new Error(`Block explorer unavailable (${response.status})`);
    if (!(response.headers.get("content-type") ?? "").includes("application/json")) throw new Error("Block explorer returned a non-JSON challenge");
    return response.json();
  }

  async getWalletTransactions(wallet: string, afterBlock = 0n): Promise<ChainTransaction[]> {
    address.parse(wallet);
    let query = `/addresses/${wallet}/transactions`;
    const output: ChainTransaction[] = [];
    for (let page = 0; page < 100; page++) {
      const data = transactionResponse.parse(await this.request(query));
      const mapped = data.items.map((item): ChainTransaction => ({ hash: item.hash, blockNumber: BigInt(item.block_number), timestamp: new Date(item.timestamp), status: item.status === "ok" ? "success" : "failed", method: item.method ?? null, valueWei: BigInt(item.value), from: item.from.hash, to: item.to?.hash ?? null, feeWei: BigInt(item.fee?.value ?? "0"), exchangeRateUsd: item.exchange_rate ?? null }));
      output.push(...mapped.filter((item) => item.blockNumber > afterBlock));
      if (!data.next_page_params || mapped.some((item) => item.blockNumber <= afterBlock)) return output;
      const params = new URLSearchParams(Object.entries(data.next_page_params).map(([key, value]) => [key, String(value)]));
      query = `/addresses/${wallet}/transactions?${params}`;
    }
    throw new Error("Wallet transaction history exceeds the safe pagination limit");
  }

  async getWalletTokenTransfers(wallet: string, afterBlock = 0n): Promise<TokenTransfer[]> {
    address.parse(wallet);
    let query = `/addresses/${wallet}/token-transfers`;
    const output: TokenTransfer[] = [];
    for (let page = 0; page < 100; page++) {
      const data = transferResponse.parse(await this.request(query));
      const mapped = data.items.flatMap((item): TokenTransfer[] => {
        const decimals = Number(item.total.decimals ?? item.token.decimals ?? "0");
        if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255 || item.token.type !== "ERC-20") return [];
        return [{ txHash: item.transaction_hash, blockNumber: BigInt(item.block_number), logIndex: item.log_index, timestamp: new Date(item.timestamp), from: item.from.hash, to: item.to.hash, tokenAddress: item.token.address_hash, symbol: item.token.symbol ?? "UNKNOWN", decimals, value: BigInt(item.total.value), tokenType: item.token.type ?? null }];
      });
      output.push(...mapped.filter((item) => item.blockNumber > afterBlock));
      if (!data.next_page_params || mapped.some((item) => item.blockNumber <= afterBlock)) return output;
      const params = new URLSearchParams(Object.entries(data.next_page_params).map(([key, value]) => [key, String(value)]));
      query = `/addresses/${wallet}/token-transfers?${params}`;
    }
    throw new Error("Wallet token-transfer history exceeds the safe pagination limit");
  }

  async getCurrentBlock(): Promise<bigint> {
    const data = z.object({ height: z.number() }).parse(await this.request("/stats"));
    return BigInt(data.height);
  }
}
