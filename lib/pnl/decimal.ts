export function pow10(decimals: number) { return 10n ** BigInt(decimals); }

export function formatFixed(value: bigint, decimals: number) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const base = pow10(decimals);
  const whole = absolute / base;
  const fraction = (absolute % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function parseFixed(value: string, decimals: number) {
  const match = value.trim().match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) throw new Error(`Invalid decimal: ${value}`);
  const fraction = (match[3] ?? "").padEnd(decimals, "0").slice(0, decimals);
  const output = BigInt(match[2]) * pow10(decimals) + BigInt(fraction || "0");
  return match[1] ? -output : output;
}

export function formatUnits(value: bigint, decimals: number) { return formatFixed(value, decimals); }

export function ratioDecimal(numerator: bigint, numeratorDecimals: number, denominator: bigint, denominatorDecimals: number, precision = 18) {
  if (denominator <= 0n) throw new Error("Ratio denominator must be positive");
  const scaled = numerator * pow10(denominatorDecimals + precision) / (denominator * pow10(numeratorDecimals));
  return formatFixed(scaled, precision);
}
