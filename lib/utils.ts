import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const compactAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;
export const usd = (value: number, compact = false) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 1 : 0 }).format(value);
export const percent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
export const summarizeAgents = (agents: { volume: number; pnl: number; trades: number }[]) => ({
  agents: agents.length,
  volume: agents.reduce((total, agent) => total + agent.volume, 0),
  pnl: agents.reduce((total, agent) => total + agent.pnl, 0),
  trades: agents.reduce((total, agent) => total + agent.trades, 0),
});
