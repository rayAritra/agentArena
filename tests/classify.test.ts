import { describe, expect, it } from "vitest";
import { classifyStockTokenTrades, USDG_ADDRESS } from "../lib/blockchain/classify";
import type { TokenTransfer } from "../lib/blockchain/blockscout";

const wallet = "0x2CCc152AD68419f777531E6A40a52325e2A80EE2";
const pool = "0x0000000000000000000000000000000000000002";
const tesla = "0x0000000000000000000000000000000000000003";
const transaction = "0x5ac4e63b468a92353536608c0b62497623bab4d1a3eca9d7caa350bc6dfa6ec1";

function transfer(overrides: Partial<TokenTransfer>): TokenTransfer {
  return { txHash: transaction, blockNumber: 10n, logIndex: 1, timestamp: new Date("2026-09-12T12:00:00Z"), from: wallet, to: pool, tokenAddress: USDG_ADDRESS, symbol: "USDG", decimals: 6, value: 2_126_890n, tokenType: "ERC-20", ...overrides };
}

describe("stock-token trade classifier", () => {
  it("derives an exact buy from the wallet's USDG and canonical stock-token flows", () => {
    const transfers = [
      transfer({}),
      transfer({ logIndex: 2, from: pool, to: wallet, tokenAddress: tesla, symbol: "TSLA", decimals: 18, value: 5_823_611_340_044_072n }),
    ];
    const result = classifyStockTokenTrades(wallet, transfers, [{ address: tesla, symbol: "TSLA" }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ side: "buy", symbol: "TSLA", quantity: "0.005823611340044072", quoteAmountUsd: "2.12689", sourceLogIndex: 2 });
    expect(Number(result[0].priceUsd)).toBeCloseTo(365.2184, 3);
  });

  it("ignores unrelated ERC-20 movements instead of inventing a trade", () => {
    expect(classifyStockTokenTrades(wallet, [transfer({ tokenAddress: "0x0000000000000000000000000000000000000004" })], [{ address: tesla, symbol: "TSLA" }])).toEqual([]);
  });
});
