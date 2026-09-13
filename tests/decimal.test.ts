import { describe, expect, it } from "vitest";
import { formatFixed, parseFixed, ratioDecimal } from "../lib/pnl/decimal";

describe("fixed-point decimals", () => {
  it("round-trips signed values without floating-point arithmetic", () => {
    expect(formatFixed(parseFixed("-12.345678", 6), 6)).toBe("-12.345678");
  });

  it("computes ratios across differing token decimals", () => {
    expect(Number(ratioDecimal(2_126_890n, 6, 5_823_611_340_044_072n, 18))).toBeCloseTo(365.2184, 3);
  });
});
