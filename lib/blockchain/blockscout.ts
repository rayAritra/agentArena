import { z } from "zod";
import { env } from "@/lib/env";

const address = z.string().regex(/^0x[\da-fA-F]{40}$/);
const addressObject = z.object({ hash: z.string(), is_contract: z.boolean().optional() });
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
const balanceResponse = z.array(z.object({
  value: z.string(),
  token: z.object({ address_hash: z.string(), symbol: z.string().nullable().optional(), name: z.string().nullable().optional(), decimals: z.string().nullable().optional(), type: z.string().nullable().optional(), exchange_rate: z.string().nullable().optional(), icon_url: z.string().nullable().optional() }),
}));
const countersResponse = z.object({ transactions_count: z.string(), token_transfers_count: z.string(), gas_usage_count: z.string().optional() });

export type ChainTransaction = { hash: string; blockNumber: bigint; timestamp: Date; status: "success" | "failed"; method: string | null; valueWei: bigint; from: string; to: string | null; feeWei: bigint; exchangeRateUsd?: string | null };
export type TokenTransfer = { txHash: string; blockNumber: bigint; logIndex: number; timestamp: Date; from: string; to: string; fromIsContract?: boolean; toIsContract?: boolean; tokenAddress: string; symbol: string; decimals: number; value: bigint; tokenType: string | null };
export type TokenBalance = { tokenAddress: string; symbol: string; name: string; decimals: number; value: bigint; exchangeRateUsd: string | null; iconUrl: string | null };
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BlockscoutClient {
  constructor(private readonly baseUrl = env.BLOCKSCOUT_API_URL) {}

  private async request(path: string, attempt = 0, maxRetries = 4): Promise<unknown> {
    const separator = path.includes("?") ? "&" : "?";
    const key = env.BLOCKSCOUT_API_KEY ? `${separator}apikey=${encodeURIComponent(env.BLOCKSCOUT_API_KEY)}` : "";
    const response = await fetch(`${this.baseUrl}${path}${key}`, { headers: { accept: "application/json", "user-agent": "AgentArena/1.0" }, signal: AbortSignal.timeout(15_000), cache: "no-store" });
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) { await wait(300 * 2 ** attempt); return this.request(path, attempt + 1, maxRetries); }
    if (!response.ok) throw new Error(`Block explorer unavailable (${response.status})`);
    if (!(response.headers.get("content-type") ?? "").includes("application/json")) throw new Error("Block explorer returned a non-JSON challenge");
    return response.json();
  }

  async getWalletTransactions(wallet: string, afterBlock = 0n, maxPages = 100, allowTruncate = false, maxRetries = 4): Promise<ChainTransaction[]> {
    address.parse(wallet);
    let query = `/addresses/${wallet}/transactions`;
    const output: ChainTransaction[] = [];
    for (let page = 0; page < maxPages; page++) {
      const data = transactionResponse.parse(await this.request(query, 0, maxRetries));
      const mapped = data.items.map((item): ChainTransaction => ({ hash: item.hash, blockNumber: BigInt(item.block_number), timestamp: new Date(item.timestamp), status: item.status === "ok" ? "success" : "failed", method: item.method ?? null, valueWei: BigInt(item.value), from: item.from.hash, to: item.to?.hash ?? null, feeWei: BigInt(item.fee?.value ?? "0"), exchangeRateUsd: item.exchange_rate ?? null }));
      output.push(...mapped.filter((item) => item.blockNumber > afterBlock));
      if (!data.next_page_params || mapped.some((item) => item.blockNumber <= afterBlock)) return output;
      const params = new URLSearchParams(Object.entries(data.next_page_params).map(([key, value]) => [key, String(value)]));
      query = `/addresses/${wallet}/transactions?${params}`;
    }
    if (allowTruncate) return output;
    throw new Error("Wallet transaction history exceeds the safe pagination limit");
  }

  async getWalletTokenTransfers(wallet: string, afterBlock = 0n, maxPages = 100, allowTruncate = false, maxRetries = 4): Promise<TokenTransfer[]> {
    address.parse(wallet);
    let query = `/addresses/${wallet}/token-transfers`;
    const output: TokenTransfer[] = [];
    for (let page = 0; page < maxPages; page++) {
      const data = transferResponse.parse(await this.request(query, 0, maxRetries));
      const mapped = data.items.flatMap((item): TokenTransfer[] => {
        const decimals = Number(item.total.decimals ?? item.token.decimals ?? "0");
        if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255 || item.token.type !== "ERC-20") return [];
        return [{ txHash: item.transaction_hash, blockNumber: BigInt(item.block_number), logIndex: item.log_index, timestamp: new Date(item.timestamp), from: item.from.hash, to: item.to.hash, fromIsContract: item.from.is_contract, toIsContract: item.to.is_contract, tokenAddress: item.token.address_hash, symbol: item.token.symbol ?? "UNKNOWN", decimals, value: BigInt(item.total.value), tokenType: item.token.type ?? null }];
      });
      output.push(...mapped.filter((item) => item.blockNumber > afterBlock));
      if (!data.next_page_params || mapped.some((item) => item.blockNumber <= afterBlock)) return output;
      const params = new URLSearchParams(Object.entries(data.next_page_params).map(([key, value]) => [key, String(value)]));
      query = `/addresses/${wallet}/token-transfers?${params}`;
    }
    if (allowTruncate) return output;
    throw new Error("Wallet token-transfer history exceeds the safe pagination limit");
  }

  async getTokenTransfers(tokenAddress: string): Promise<TokenTransfer[]> {
    address.parse(tokenAddress);
    const data = transferResponse.parse(await this.request(`/tokens/${tokenAddress}/transfers`));
    return data.items.flatMap((item): TokenTransfer[] => {
      const decimals = Number(item.total.decimals ?? item.token.decimals ?? "0");
      if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255 || item.token.type !== "ERC-20") return [];
      return [{ txHash: item.transaction_hash, blockNumber: BigInt(item.block_number), logIndex: item.log_index, timestamp: new Date(item.timestamp), from: item.from.hash, to: item.to.hash, fromIsContract: item.from.is_contract, toIsContract: item.to.is_contract, tokenAddress: item.token.address_hash, symbol: item.token.symbol ?? "UNKNOWN", decimals, value: BigInt(item.total.value), tokenType: item.token.type ?? null }];
    });
  }

  async getTokenBalances(wallet: string): Promise<TokenBalance[]> {
    address.parse(wallet);
    const data = balanceResponse.parse(await this.request(`/addresses/${wallet}/token-balances`));
    return data.flatMap((item): TokenBalance[] => {
      const decimals = Number(item.token.decimals ?? "0");
      if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255 || item.token.type !== "ERC-20") return [];
      return [{ tokenAddress: item.token.address_hash, symbol: item.token.symbol ?? "UNKNOWN", name: item.token.name ?? item.token.symbol ?? "Unknown token", decimals, value: BigInt(item.value), exchangeRateUsd: item.token.exchange_rate ?? null, iconUrl: item.token.icon_url ?? null }];
    });
  }

  async getAddressCounters(wallet: string) {
    address.parse(wallet);
    return countersResponse.parse(await this.request(`/addresses/${wallet}/counters`));
  }

  async getCurrentBlock(): Promise<bigint> {
    const data = z.object({ height: z.number() }).parse(await this.request("/stats"));
    return BigInt(data.height);
  }
}
