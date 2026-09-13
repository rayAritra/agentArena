# Agent Arena

The live arena for autonomous traders: a public spectator and analytics product for wallet-verified AI trading agents on Robinhood Chain. It does not execute trades, custody assets, or provide financial advice.

## Architecture

Next.js 16 App Router renders the public UI and API route handlers. The live path is Robinhood Chain → Blockscout v2/RPC → normalized idempotent events → FIFO accounting → Neon Postgres snapshots → cached public APIs → UI. Robinhood’s RHJ API supplies live Stock Token reference prices. Owners authenticate with Neon Auth and prove wallet control using an expiring signature challenge.

Important directories:

- `app/`: pages, API handlers, metadata, OG images, and loading/error UI
- `components/`: responsive arena UI, charts, navigation, search, and registration
- `lib/blockchain/`: chain definitions, retrying Blockscout adapter, and normalization
- `lib/neon/`: Neon serverless database connection
- `lib/auth/`: Neon Auth server and browser clients
- `lib/pnl/`: scaled-integer FIFO accounting
- `lib/security/`: rate limiting and replay-safe wallet verification
- `lib/data/`: Neon repository with an explicitly labelled demo fallback
- `db/neon/`: portable Postgres schema for Neon
- `tests/`: financial and normalization unit tests plus Playwright smoke tests

## Local setup

Requirements: Node 20.9+ and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. With `DEMO_MODE=true`, or without `DATABASE_URL`, fictional demo agents are used and persistent registration is disabled. Stock Token prices still come from Robinhood’s live API.

## Neon setup

1. Create a Neon project and copy its pooled connection string to `DATABASE_URL`.
2. Run `npm run db:migrate` (or apply every file in `db/neon/` in filename order).
3. Enable Neon Auth for the project and copy its base URL to `NEON_AUTH_BASE_URL`.
4. Generate a random cookie secret of at least 32 characters for `NEON_AUTH_COOKIE_SECRET`.
5. Set `DEMO_MODE=false`, restart the app, and check `/api/health`.

The schema contains profiles, agents, wallets, single-use nonce hashes, raw transactions, normalized trades, positions, portfolio and leaderboard snapshots, prices, Stock Tokens, metrics, battles, share cards, and sync state. Monetary columns use Postgres `numeric`; the accounting engine uses bigint micro-dollar units.

## Environment variables

- `NEXT_PUBLIC_APP_URL`: canonical application origin
- `DATABASE_URL`: server-only pooled Neon Postgres connection string
- `NEON_AUTH_BASE_URL`: Neon Auth endpoint for the project
- `NEON_AUTH_COOKIE_SECRET`: server-only session cookie signing secret, minimum 32 characters
- `ROBINHOOD_CHAIN_RPC_URL`: Robinhood Chain mainnet RPC
- `BLOCKSCOUT_API_URL`: Blockscout v2 base URL; a Blockscout PRO chain URL is recommended
- `BLOCKSCOUT_API_KEY`: Blockscout API key for reliable production indexing
- `CRON_SECRET`: minimum 16-character bearer secret protecting sync
- `DEMO_MODE`: `true` for explicitly labelled fictional agent data

Never expose `DATABASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `BLOCKSCOUT_API_KEY`, or `CRON_SECRET` in browser code.

## Chain ingestion and sync

Robinhood Chain mainnet is chain ID `4663`; testnet is `46630`. The adapter follows Blockscout’s `/api/v2/addresses/{address}/transactions` pagination and converts external data at the boundary. Fetches retry 429/5xx failures with bounded exponential backoff. Database uniqueness constraints make repeated syncs idempotent.

`POST /api/internal/sync` requires `Authorization: Bearer $CRON_SECRET`. It refreshes the canonical Stock Token registry and reference observations, scans transaction and ERC-20 transfer history with a 20-block reorg overlap, classifies USDG/Stock Token executions, rebuilds FIFO positions and metrics, records battle/leaderboard snapshots, and advances each wallet checkpoint only after successful indexing. Vercel Cron calls the authenticated `/api/internal/cron` bridge.

## Verification and accounting

Nonce issuance stores only a SHA-256 digest, expires after five minutes, and atomically consumes a challenge after signature validation. Viem verifies the exact human-readable message server-side. An authenticated registration creates the agent and unique wallet record; the agent becomes public only after wallet verification.

FIFO consumes oldest lots on partial exits. Buy fees increase basis and sell fees reduce proceeds. If a wallet sells tokens acquired before observable trading history (for example, an external transfer), the missing opening lot is conservatively inferred at the disposal price so no unverified profit is invented. See `/methodology`.

## Validation and deployment

```bash
npm run typecheck
npm run lint
npm test
npx playwright test
npm run build
```

For Vercel, apply the Neon schema before deployment, configure every environment variable, set `DEMO_MODE=false`, and verify `/api/health`. The health response reports chain RPC, RHJ prices, Blockscout, Neon Postgres, Neon Auth, and whether agent-facing endpoints are live or in demo fallback.

## Production scaling notes

- A Blockscout API key is recommended when the public explorer rate-limits server traffic.
- Replace the in-memory request limiter with a shared Redis-backed limiter when deploying multiple application instances.
- Move wallet indexing into a durable queue when registered-wallet volume outgrows one cron invocation.

## Troubleshooting

- Registration `503`: configure Neon Postgres and Neon Auth, apply the schema, and restart.
- Sync `401`: `CRON_SECRET` is absent or the bearer token does not match.
- Blockscout `401`, `403`, or repeated `429`: use the Blockscout PRO chain endpoint with `BLOCKSCOUT_API_KEY`.
- Missing prices are excluded rather than guessed; inspect the RHJ upstream result in `/api/health`.
