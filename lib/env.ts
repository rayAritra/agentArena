import "server-only";
import { z } from "zod";
const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional());
const optionalSecret = (minimum: number) => z.preprocess((value) => value === "" ? undefined : value, z.string().min(minimum).optional());
const optionalString = z.preprocess((value) => value === "" ? undefined : value, z.string().optional());
const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: optionalUrl,
  NEON_AUTH_BASE_URL: optionalUrl,
  NEON_AUTH_COOKIE_SECRET: optionalSecret(32),
  ROBINHOOD_CHAIN_RPC_URL: z.string().url().default("https://rpc.mainnet.chain.robinhood.com"),
  BLOCKSCOUT_API_URL: z.string().url().default("https://robinhoodchain.blockscout.com/api/v2"),
  BLOCKSCOUT_API_KEY: optionalString,
  CRON_SECRET: optionalSecret(16),
  WEBHOOK_ENCRYPTION_KEY: optionalSecret(32),
  DEMO_MODE: z.enum(["true","false"]).default("true")
});
export const env = schema.parse(process.env);
export const isDemoMode = env.DEMO_MODE === "true" || !env.DATABASE_URL;
