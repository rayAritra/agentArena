import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";

async function main() {
  loadEnvConfig(process.cwd());
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const directory = path.join(process.cwd(), "db", "neon");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  const sql = neon(connectionString);
  for (const file of files) {
    const contents = await readFile(path.join(directory, file), "utf8");
    const statements = contents.split(";").map((statement) => statement.trim()).filter(Boolean);
    for (const statement of statements) await sql.query(statement);
    console.log(`Applied ${file} (${statements.length} statements)`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
