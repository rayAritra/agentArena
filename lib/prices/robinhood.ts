import { z } from "zod";

const addressPattern = /^0x[\da-fA-F]{40}$/;
const deploymentSchema = z.object({
  contractAddress: z.string().regex(addressPattern),
  chainId: z.number(),
  networkName: z.string().optional(),
});
const assetSchema = z.object({
  tokenSymbol: z.string(),
  tokenName: z.string(),
  deployments: z.array(deploymentSchema),
  currentMultiplier: z.string().default("1"),
  status: z.string(),
  logoUrl: z.string().url().optional(),
  tokenDecimals: z.number().default(18),
});
const quoteSchema = z.object({
  tokenSymbol: z.string(),
  deployments: z.array(deploymentSchema),
  bid: z.string(),
  ask: z.string(),
  currency: z.literal("USD"),
  dailyTradingVolume: z.string(),
  isTradingHalt: z.boolean(),
  generatedAt: z.string(),
});
const assetsResponse = z.object({ assets: z.array(assetSchema) });
const quoteResponse = z.object({ quotes: z.array(quoteSchema) });
const pairSchema = z.object({
  chainId: z.string().optional(),
  dexId: z.string().optional(),
  pairAddress: z.string().optional(),
  baseToken: z.object({ address: z.string(), symbol: z.string() }),
  quoteToken: z.object({ address: z.string(), symbol: z.string() }),
  priceUsd: z.string().nullable().optional(),
  priceChange: z.object({ h24: z.number().optional() }).passthrough().nullable().optional(),
  volume: z.object({ h24: z.number().optional() }).passthrough().optional(),
  liquidity: z.object({ usd: z.number().optional() }).passthrough().nullable().optional(),
});

export type StockTokenAsset = z.infer<typeof assetSchema> & { contractAddress: string };
export type LiveStockToken = {
  symbol: string;
  name: string;
  contractAddress: string;
  logoUrl?: string;
  price: number | null;
  reference: number;
  bid: number;
  ask: number;
  day: number | null;
  volume: number | null;
  liquidityUsd: number | null;
  series: number[];
  updatedAt: string;
  halted: boolean;
  source: "DEX Screener + Robinhood RHJ API" | "Robinhood RHJ API";
  priceKind: "dex" | "reference-only";
  marketAvailable: boolean;
  dex: string | null;
  pairAddress: string | null;
};

const robinhoodBase = "https://api.robinhood.com/rhj";
const dexBase = "https://api.dexscreener.com";

async function requestRobinhood(path: string) {
  const response = await fetch(`${robinhoodBase}${path}`, { headers: { accept: "application/json" }, next: { revalidate: 15 }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Robinhood Stock Token API unavailable (${response.status})`);
  return response.json();
}

function chunks<T>(items: T[], size: number) {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}

async function getDexMarkets(addresses: string[]) {
  const markets = new Map<string, z.infer<typeof pairSchema>>();
  const batches = chunks([...new Set(addresses.map((value) => value.toLowerCase()))], 30);
  for (let index = 0; index < batches.length; index += 4) {
    await Promise.all(batches.slice(index, index + 4).map(async (batch) => {
      const response = await fetch(`${dexBase}/tokens/v1/robinhood/${batch.join(",")}`, { headers: { accept: "application/json" }, next: { revalidate: 15 }, signal: AbortSignal.timeout(15_000) });
      if (!response.ok) return;
      const pairs = z.array(pairSchema).safeParse(await response.json());
      if (!pairs.success) return;
      for (const pair of pairs.data) {
        const token = pair.baseToken.address.toLowerCase();
        if (!batch.includes(token) || !pair.priceUsd) continue;
        const current = markets.get(token);
        if (!current || (pair.liquidity?.usd ?? 0) > (current.liquidity?.usd ?? 0)) markets.set(token, pair);
      }
    }));
  }
  return markets;
}

export async function getStockTokenAssets(): Promise<StockTokenAsset[]> {
  const assets = assetsResponse.parse(await requestRobinhood("/assets")).assets;
  return assets.flatMap((asset) => {
    const deployment = asset.deployments.find((item) => item.chainId === 4663);
    return deployment && asset.status === "ASSET_STATUS_ACTIVE" ? [{ ...asset, contractAddress: deployment.contractAddress }] : [];
  });
}

export async function getLiveStockTokens(symbols?: string[]): Promise<LiveStockToken[]> {
  const assets = await getStockTokenAssets();
  const requested = symbols ? new Set(symbols.map((symbol) => symbol.toUpperCase())) : null;
  const selectedAssets = requested ? assets.filter((asset) => requested.has(asset.tokenSymbol)) : assets;
  const quotePayload = symbols && symbols.length <= 8
    ? { quotes: (await Promise.all(symbols.map(async (symbol) => quoteResponse.parse(await requestRobinhood(`/prices/${encodeURIComponent(symbol)}`)).quotes[0]))).filter(Boolean) }
    : quoteResponse.parse(await requestRobinhood("/prices"));
  const quoteBySymbol = new Map(quotePayload.quotes.map((quote) => [quote.tokenSymbol, quote]));
  const dexMarkets = await getDexMarkets(selectedAssets.map((asset) => asset.contractAddress));

  return selectedAssets.flatMap((asset) => {
    const quote = quoteBySymbol.get(asset.tokenSymbol);
    if (!quote) return [];
    const bid = Number(quote.bid);
    const ask = Number(quote.ask);
    const reference = ((bid + ask) / 2) * Number(asset.currentMultiplier);
    const market = dexMarkets.get(asset.contractAddress.toLowerCase());
    const marketPrice = market?.priceUsd ? Number(market.priceUsd) : null;
    const marketAvailable = marketPrice !== null && Number.isFinite(marketPrice) && marketPrice > 0;
    return [{
      symbol: quote.tokenSymbol,
      name: asset.tokenName,
      contractAddress: asset.contractAddress,
      logoUrl: asset.logoUrl,
      price: marketAvailable ? marketPrice : null,
      reference,
      bid,
      ask,
      day: marketAvailable ? market?.priceChange?.h24 ?? null : null,
      volume: marketAvailable ? market?.volume?.h24 ?? null : null,
      liquidityUsd: marketAvailable ? market?.liquidity?.usd ?? null : null,
      series: marketAvailable ? [marketPrice] : [],
      updatedAt: quote.generatedAt,
      halted: quote.isTradingHalt,
      source: marketAvailable ? "DEX Screener + Robinhood RHJ API" : "Robinhood RHJ API",
      priceKind: marketAvailable ? "dex" : "reference-only",
      marketAvailable,
      dex: market?.dexId ?? null,
      pairAddress: market?.pairAddress ?? null,
    } satisfies LiveStockToken];
  });
}
