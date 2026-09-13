import "server-only";import { createNeonAuth } from "@neondatabase/auth/next/server";import { env } from "@/lib/env";
export const auth=env.NEON_AUTH_BASE_URL&&env.NEON_AUTH_COOKIE_SECRET?createNeonAuth({baseUrl:env.NEON_AUTH_BASE_URL,cookies:{secret:env.NEON_AUTH_COOKIE_SECRET}}):null;
export async function getCurrentUser(){if(!auth)return null;const{data}=await auth.getSession();return data?.user??null}
