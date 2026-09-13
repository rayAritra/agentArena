# Data pipeline

1. Acquire a database lease per verified wallet.
2. Resume from its block cursor with a 20-block reorganization overlap.
3. Fetch transactions and ERC-20 transfers with bounded exponential retry.
4. Upsert raw normalized records with database uniqueness constraints.
5. Classify only opposite USDG/canonical Stock Token wallet flows.
6. Rebuild FIFO lots, positions, realized/unrealized P&L, and snapshots.
7. Calculate deterministic score, DNA, events, battles, and achievements.
8. Fan events into in-app notifications and signed webhook deliveries.
9. Advance the cursor only after successful accounting; otherwise store a bounded retry time and diagnostic message.
