import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { robinhoodChain } from "@/lib/blockchain/chain";
import { getSql } from "@/lib/neon/db";

type NonceRecord = { id: string; address: string; nonce: string; expiresAt: Date; used: boolean };
const local = new Map<string, NonceRecord>();
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const verificationMessage=(address:string,nonce:string,expires:string)=>`Agent Arena wallet verification\n\nDomain: ${new URL(process.env.NEXT_PUBLIC_APP_URL??"http://localhost:3000").host}\nChain ID: 4663\nWallet: ${address}\nNonce: ${nonce}\nExpires: ${expires}\n\nThis request does not initiate a transaction.`;

export async function issueNonce(address: string) {
  const nonce = randomBytes(24).toString("hex");
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60_000);
  const sql = getSql();
  if (sql) await sql.query("insert into wallet_verification_nonces (id,address,nonce_hash,expires_at) values ($1,$2,$3,$4)", [id, address, hash(nonce), expiresAt.toISOString()]);
  else local.set(id, { id, address, nonce, expiresAt, used: false });
  return { id, message: verificationMessage(address,nonce,expiresAt.toISOString()), expiresAt: expiresAt.toISOString() };
}

export async function confirmSignature(input: { address: string; nonceId: string; signature: string; message: string }) {
  const sql = getSql();
  let nonceHash = "";
  let nonce = "";
  let validRecord = false;
  if (sql) {
    const rows = await sql.query("select nonce_hash,expires_at,used_at from wallet_verification_nonces where id=$1 and address=$2 limit 1", [input.nonceId, input.address]) as Array<{ nonce_hash: string; expires_at: string; used_at: string | null }>;
    const record = rows[0];
    nonce = input.message.match(/Nonce: ([a-f0-9]+)/)?.[1] ?? "";
    nonceHash = record?.nonce_hash ?? "";
    validRecord = !!record && !record.used_at && new Date(record.expires_at) > new Date() && hash(nonce) === nonceHash && input.message === verificationMessage(input.address,nonce,new Date(record.expires_at).toISOString());
  } else {
    const record = local.get(input.nonceId);
    nonce = record?.nonce ?? "";
    validRecord = !!record && !record.used && record.address === input.address && record.expiresAt > new Date() && input.message === verificationMessage(input.address,nonce,record.expiresAt.toISOString());
  }
  if (!validRecord) throw new Error("Challenge is invalid, expired, or already used");
  const valid = await createPublicClient({ chain: robinhoodChain, transport: http() }).verifyMessage({ address: input.address as Address, message: input.message, signature: input.signature as Hex });
  if (!valid) throw new Error("Signature rejected");
  if (sql) {
    const consumed = await sql.query("update wallet_verification_nonces set used_at=now() where id=$1 and nonce_hash=$2 and used_at is null returning id", [input.nonceId, nonceHash]);
    if (!consumed[0]) throw new Error("Challenge was already consumed");
  } else {
    const record = local.get(input.nonceId);
    if (!record || record.used) throw new Error("Challenge was already consumed");
    record.used = true;
  }
  return true;
}
