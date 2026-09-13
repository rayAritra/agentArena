# Public API v1

All V1 responses use `{ data, meta, error }` and include a request ID. Available read routes include agents, agent detail/trades/portfolio/performance/score/DNA, leaderboard, tokens, token holders, market consensus/flows, battles, and events. `/api/v1/events/stream` is an SSE feed.

Authenticated routes manage `/api/v1/watchlist`, `/api/v1/alerts`, `/api/v1/api-keys`, and `/api/v1/webhooks`. API keys start with `aa_live_`; the raw value is returned once and only its SHA-256 digest is persisted. Webhooks are HTTPS-only, reject private/metadata networks, are signed with HMAC-SHA256, do not follow redirects, and retry at bounded exponential intervals.
