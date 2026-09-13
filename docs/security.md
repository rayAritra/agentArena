# Security model

Neon Auth owns browser sessions. Mutations require authentication, owner checks, trusted origins, Zod validation, and rate limits. Wallet challenges expire, are one-time, store only nonce hashes, and bind the exact message to the application domain, Robinhood Chain ID 4663, wallet, nonce, and expiration. Secrets remain server-only.

Webhook signing secrets are encrypted at rest with AES-256-GCM using `WEBHOOK_ENCRYPTION_KEY`; endpoint DNS is checked at creation and immediately before delivery to reduce DNS rebinding risk. Private IPs, credentials, non-HTTPS URLs, unsafe ports, and redirects are rejected.
