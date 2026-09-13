import "server-only";
import {
  BlockscoutClient,
  type ChainTransaction,
} from "@/lib/blockchain/blockscout";
import {
  classifyStockTokenTrades,
  USDG_ADDRESS,
} from "@/lib/blockchain/classify";
import { getSql } from "@/lib/neon/db";
import { calculateFifo, unrealizedPnl, type Trade } from "@/lib/pnl/fifo";
import { formatFixed, formatUnits, parseFixed } from "@/lib/pnl/decimal";
import {
  getLiveStockTokens,
  getStockTokenAssets,
} from "@/lib/prices/robinhood";

const QUANTITY_SCALE = 1_000_000n,
  MONEY_SCALE = 6;
const ZERO = "0x0000000000000000000000000000000000000000";
const WETH = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";

function transactionFeeUsd(transaction: ChainTransaction | undefined) {
  if (!transaction?.exchangeRateUsd || transaction.feeWei === 0n) return 0;
  return Number(
    formatFixed(
      (transaction.feeWei * parseFixed(transaction.exchangeRateUsd, 6)) /
        1_000_000_000_000_000_000n,
      6,
    ),
  );
}

async function loadDiscoveredWallets() {
  const assets = await getStockTokenAssets();
  const preferred = ["AAPL", "NVDA", "TSLA", "MSFT"];
  const selected = preferred
    .map((symbol) => assets.find((asset) => asset.tokenSymbol === symbol))
    .filter((asset): asset is NonNullable<typeof asset> => !!asset);
  const client = new BlockscoutClient();
  const batches = await Promise.allSettled(
    selected.map((asset) => client.getTokenTransfers(asset.contractAddress)),
  );
  const candidates = new Map<
    string,
    {
      address: string;
      events: number;
      lastActivity: string;
      symbols: Set<string>;
    }
  >();
  for (const batch of batches)
    if (batch.status === "fulfilled")
      for (const transfer of batch.value) {
        const sides = [
          { address: transfer.from, isContract: transfer.fromIsContract },
          { address: transfer.to, isContract: transfer.toIsContract },
        ];
        for (const side of sides) {
          const address = side.address.toLowerCase();
          if (side.isContract || address === ZERO) continue;
          const current = candidates.get(address) ?? {
            address,
            events: 0,
            lastActivity: transfer.timestamp.toISOString(),
            symbols: new Set<string>(),
          };
          current.events++;
          current.symbols.add(transfer.symbol);
          if (transfer.timestamp.toISOString() > current.lastActivity)
            current.lastActivity = transfer.timestamp.toISOString();
          candidates.set(address, current);
        }
      }
  return [...candidates.values()]
    .sort(
      (a, b) =>
        b.events - a.events || b.lastActivity.localeCompare(a.lastActivity),
    )
    .slice(0, 18)
    .map((item) => ({
      address: item.address,
      observedEvents: item.events,
      lastActivity: item.lastActivity,
      symbols: [...item.symbols].sort(),
      source: "Blockscout token-transfer API",
      verified: false,
    }));
}

async function loadPublicWalletProfile(address: string) {
  const wallet = address.toLowerCase(),
    client = new BlockscoutClient();
  const requests = await Promise.allSettled([
    getLiveStockTokens(),
    client.getWalletTransactions(wallet, 0n, 2, true),
    client.getWalletTokenTransfers(wallet, 0n, 3, true),
    client.getTokenBalances(wallet),
    client.getAddressCounters(wallet),
  ] as const);
  const tokens = requests[0].status === "fulfilled" ? requests[0].value : [];
  const transactions =
    requests[1].status === "fulfilled" ? requests[1].value : [];
  const transfers = requests[2].status === "fulfilled" ? requests[2].value : [];
  const balances = requests[3].status === "fulfilled" ? requests[3].value : [];
  const counters =
    requests[4].status === "fulfilled"
      ? requests[4].value
      : {
          transactions_count: String(transactions.length),
          token_transfers_count: String(transfers.length),
        };
  const apiWarnings = [
    "market prices",
    "transactions",
    "token transfers",
    "token balances",
    "address counters",
  ].filter((_, index) => requests[index].status === "rejected");
  const assets = tokens.map((token) => ({
    address: token.contractAddress.toLowerCase(),
    symbol: token.symbol,
  }));
  const trades = classifyStockTokenTrades(wallet, transfers, assets);
  const txByHash = new Map(
    transactions.map((transaction) => [
      transaction.hash.toLowerCase(),
      transaction,
    ]),
  );
  const fifoTrades: Trade[] = trades.flatMap((trade) => {
    const quantity = parseFixed(trade.quantity, 6);
    if (quantity <= 0n) return [];
    return [
      {
        id: trade.id,
        asset: trade.assetAddress,
        side: trade.side,
        quantity,
        unitPriceMicros: parseFixed(trade.priceUsd, 6),
        feeMicros: BigInt(
          Math.round(
            transactionFeeUsd(txByHash.get(trade.txHash.toLowerCase())) *
              1_000_000,
          ),
        ),
        timestamp: trade.tradedAt,
      },
    ];
  });
  const accounting = calculateFifo(fifoTrades, QUANTITY_SCALE, true);
  const priceByAddress = new Map(
    tokens.map((token) => [
      token.contractAddress.toLowerCase(),
      token.reference,
    ]),
  );
  let unrealized = 0n;
  for (const position of accounting.positions.values()) {
    const mark = parseFixed(
      String(priceByAddress.get(position.asset) ?? 0),
      MONEY_SCALE,
    );
    unrealized += unrealizedPnl(position, mark, QUANTITY_SCALE);
  }
  const wins = accounting.outcomes.filter(
    (outcome) => outcome.realizedPnlMicros > 0n,
  ).length;
  const canonical = new Set(assets.map((asset) => asset.address));
  const holdings = balances
    .filter((balance) => balance.value > 0n)
    .map((balance) => {
      const tokenAddress = balance.tokenAddress.toLowerCase();
      const quantity = Number(formatUnits(balance.value, balance.decimals));
      const price =
        priceByAddress.get(tokenAddress) ??
        Number(balance.exchangeRateUsd ?? 0);
      return {
        tokenAddress,
        symbol: balance.symbol,
        name: balance.name,
        quantity,
        priceUsd: price,
        valueUsd: quantity * price,
        kind: canonical.has(tokenAddress)
          ? "Stock Token"
          : tokenAddress === USDG_ADDRESS
            ? "Stablecoin"
            : "Token",
        iconUrl: balance.iconUrl,
      };
    })
    .filter(
      (holding) =>
        holding.kind === "Stock Token" ||
        holding.tokenAddress === USDG_ADDRESS ||
        holding.tokenAddress === WETH ||
        holding.valueUsd > 0,
    )
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, 250);
  const volume = trades.reduce(
      (sum, trade) => sum + Number(trade.quoteAmountUsd),
      0,
    ),
    measurementCount = accounting.outcomes.length;
  const sql = getSql();
  const registered = sql
    ? await sql
        .query(
          "select a.slug,a.name,a.verified_at is not null as verified from agents a join agent_wallets w on w.agent_id=a.id where w.address=$1 limit 1",
          [wallet],
        )
        .then(
          (rows) => rows as Array<{ slug: string; name: string; verified: boolean }>,
        )
        .catch(() => [])
    : [];
  return {
    address: wallet,
    name:
      registered[0]?.name ?? `Wallet ${wallet.slice(0, 6)}…${wallet.slice(-4)}`,
    registeredAgent: registered[0] ?? null,
    verified: registered[0]?.verified ?? false,
    source: "Live Blockscout + Robinhood RHJ APIs",
    apiWarnings,
    updatedAt: new Date().toISOString(),
    lastActivity:
      [
        ...transactions.map((item) => item.timestamp),
        ...transfers.map((item) => item.timestamp),
      ]
        .sort((a, b) => b.getTime() - a.getTime())[0]
        ?.toISOString() ?? null,
    counters: {
      transactions: Number(counters.transactions_count),
      tokenTransfers: Number(counters.token_transfers_count),
      loadedTransactions: transactions.length,
      loadedTokenTransfers: transfers.length,
    },
    metrics: {
      portfolioValueUsd: holdings.reduce((sum, item) => sum + item.valueUsd, 0),
      observedRealizedPnlUsd: Number(
        formatFixed(accounting.realizedPnlMicros, 6),
      ),
      observedUnrealizedPnlUsd: Number(formatFixed(unrealized, 6)),
      observedVolumeUsd: volume,
      classifiedTrades: trades.length,
      winRate: measurementCount ? (wins / measurementCount) * 100 : 0,
    },
    holdings,
    recentTrades: [...trades]
      .sort((a, b) => b.tradedAt.getTime() - a.tradedAt.getTime())
      .slice(0, 100)
      .map((trade) => ({
        txHash: trade.txHash,
        side: trade.side,
        symbol: trade.symbol,
        quantity: Number(trade.quantity),
        priceUsd: Number(trade.priceUsd),
        notionalUsd: Number(trade.quoteAmountUsd),
        feeUsd: transactionFeeUsd(txByHash.get(trade.txHash.toLowerCase())),
        blockNumber: trade.blockNumber.toString(),
        tradedAt: trade.tradedAt.toISOString(),
      })),
    recentTransactions: transactions
      .slice(0, 50)
      .map((transaction) => ({
        hash: transaction.hash,
        blockNumber: transaction.blockNumber.toString(),
        timestamp: transaction.timestamp.toISOString(),
        status: transaction.status,
        method: transaction.method,
        valueEth: Number(formatUnits(transaction.valueWei, 18)),
        feeUsd: transactionFeeUsd(transaction),
        from: transaction.from,
        to: transaction.to,
      })),
  };
}

let discoveryCache: { expiresAt: number; value: Awaited<ReturnType<typeof loadDiscoveredWallets>> } | null = null;
const walletCache = new Map<string, { expiresAt: number; value: Awaited<ReturnType<typeof loadPublicWalletProfile>> }>();

export async function getDiscoveredWallets() {
  if (discoveryCache && discoveryCache.expiresAt > Date.now()) return discoveryCache.value;
  const value = await loadDiscoveredWallets();
  discoveryCache = { value, expiresAt: Date.now() + 30_000 };
  return value;
}

export async function getPublicWalletProfile(address: string) {
  const key = address.toLowerCase();
  const cached = walletCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const value = await loadPublicWalletProfile(key);
  if (walletCache.size > 100) walletCache.clear();
  walletCache.set(key, { value, expiresAt: Date.now() + 30_000 });
  return value;
}
