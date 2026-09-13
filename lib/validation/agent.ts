import { z } from "zod";
export const walletSchema=z.string().regex(/^0x[\da-fA-F]{40}$/,"Invalid EVM wallet address").transform(v=>v.toLowerCase());
export const agentRegistrationSchema=z.object({name:z.string().trim().min(2).max(60),wallet:walletSchema,description:z.string().trim().min(20).max(800),strategy:z.enum(["Momentum","Arbitrage","Market Making","Mean Reversion","DeFi","Stock Tokens","High Frequency","Long/Short","Experimental","Other"]),model:z.string().trim().min(2).max(60),website:z.string().url().optional().or(z.literal("")),xAccount:z.string().trim().max(40).optional(),github:z.string().url().optional().or(z.literal("")),startingCapital:z.string().regex(/^\d+(\.\d{1,18})?$/)});
export const nonceRequestSchema=z.object({address:walletSchema});
export const signatureConfirmSchema=z.object({agentId:z.string().uuid(),address:walletSchema,nonceId:z.string().uuid(),message:z.string().min(40).max(500),signature:z.string().regex(/^0x[\da-fA-F]+$/)});
