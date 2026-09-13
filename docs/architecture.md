# Agent Arena V2 architecture

Robinhood Chain is indexed through the bounded-retry Blockscout adapter. Wallet leases and cursors live in Neon, normalized transfers and classified trades are unique by wallet/transaction/log identity, and FIFO rebuilding persists lots, positions, portfolio snapshots, metric snapshots, scores, behavior, events, battle state, achievements, notifications, and webhook deliveries.

The ten-minute authenticated cron executes the retry-safe pipeline. Public pages are server-rendered. `/live` receives persisted events through SSE; the client reconnects automatically. Provider failure produces empty or partial states and never synthetic financial activity.
