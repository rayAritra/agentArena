import type { TokenTransfer } from "./blockscout";
import { formatUnits, ratioDecimal } from "../pnl/decimal";

export const USDG_ADDRESS = "0x5fc5360d0400a0fd4f2af552add042d716f1d168";
export type CanonicalAsset = { address: string; symbol: string };
export type ClassifiedTrade = { id: string; txHash: string; sourceLogIndex: number; blockNumber: bigint; tradedAt: Date; side: "buy" | "sell"; assetAddress: string; symbol: string; quantity: string; priceUsd: string; quoteAmountUsd: string };

export function classifyStockTokenTrades(wallet: string, transfers: TokenTransfer[], assets: CanonicalAsset[]): ClassifiedTrade[] {
  const own = wallet.toLowerCase();
  const byAddress = new Map(assets.map((asset) => [asset.address.toLowerCase(), asset]));
  const grouped = new Map<string, TokenTransfer[]>();
  for (const transfer of transfers) grouped.set(transfer.txHash, [...(grouped.get(transfer.txHash) ?? []), transfer]);
  const output: ClassifiedTrade[] = [];

  for (const [txHash, group] of grouped) {
    const stockTransfers = group.filter((transfer) => byAddress.has(transfer.tokenAddress.toLowerCase()) && (transfer.from.toLowerCase() === own || transfer.to.toLowerCase() === own));
    const stockAddresses = [...new Set(stockTransfers.map((transfer) => transfer.tokenAddress.toLowerCase()))];
    if (stockAddresses.length !== 1) continue;
    const stockAddress = stockAddresses[0];
    const incoming = stockTransfers.filter((transfer) => transfer.to.toLowerCase() === own).reduce((total, transfer) => total + transfer.value, 0n);
    const outgoing = stockTransfers.filter((transfer) => transfer.from.toLowerCase() === own).reduce((total, transfer) => total + transfer.value, 0n);
    if ((incoming > 0n) === (outgoing > 0n)) continue;
    const side = incoming > 0n ? "buy" : "sell";
    const stockValue = incoming > 0n ? incoming : outgoing;
    const source = stockTransfers.filter((transfer) => side === "buy" ? transfer.to.toLowerCase() === own : transfer.from.toLowerCase() === own).sort((a, b) => a.logIndex - b.logIndex)[0];
    if (!source) continue;

    const quoteTransfers = group.filter((transfer) => transfer.tokenAddress.toLowerCase() === USDG_ADDRESS);
    const quoteIncoming = quoteTransfers.filter((transfer) => transfer.to.toLowerCase() === own).reduce((total, transfer) => total + transfer.value, 0n);
    const quoteOutgoing = quoteTransfers.filter((transfer) => transfer.from.toLowerCase() === own).reduce((total, transfer) => total + transfer.value, 0n);
    const quoteValue = side === "buy" ? quoteOutgoing - quoteIncoming : quoteIncoming - quoteOutgoing;
    if (quoteValue <= 0n) continue;
    const quoteDecimals = quoteTransfers[0]?.decimals ?? 6;
    const asset = byAddress.get(stockAddress)!;
    output.push({ id: `${txHash}:${stockAddress}:${side}`, txHash, sourceLogIndex: source.logIndex, blockNumber: source.blockNumber, tradedAt: source.timestamp, side, assetAddress: stockAddress, symbol: asset.symbol, quantity: formatUnits(stockValue, source.decimals), priceUsd: ratioDecimal(quoteValue, quoteDecimals, stockValue, source.decimals), quoteAmountUsd: formatUnits(quoteValue, quoteDecimals) });
  }
  return output.sort((a, b) => a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : a.sourceLogIndex - b.sourceLogIndex);
}
