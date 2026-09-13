import "server-only";import { neon } from "@neondatabase/serverless";import { env } from "@/lib/env";
export function getSql(){return env.DATABASE_URL?neon(env.DATABASE_URL):null}
export function requireSql(){const sql=getSql();if(!sql)throw new Error("Database is not configured");return sql}
