# Sparkle Backend Operations and Integration

This iteration preserves CSS, colors, assets and page layouts while completing persistence, authorization, queues and commercial orders. The following distinguishes implemented code from validation requiring actual providers.

## Implemented

- SQLite persistence for projects, canvases, subjects, workspace demo canvases, asset libraries, templates and versions, chats, generation jobs, agent runs, skill runs, orders, commissions, users, sessions, usage limits, payment events, wallet entries, payouts and template licenses. Business data carries `ownerId`; shared-market queries explicitly return only published content.
- Revision-based canvas and chat saves reject stale overwrites. Canvas validation covers duplicate nodes, invalid edges, cycles and limits. Project/canvas and commission/order writes use transactions.
- Uploads validate actual file formats, image decoding and sizes. Private storage is read through authorization or short-lived signatures. Deleting a library entry does not immediately break files still referenced by canvases. Network imports reject private addresses, pin DNS results, forbid redirects and limit download duration and size.
- Generation jobs, agent tasks and skill results are persisted. Duplicate `requestId` values do not repeat execution. Queued jobs recover; running jobs with uncertain billing are not automatically resubmitted. Canceling a local wait cannot guarantee that provider billing stops.
- Eight agents retain independent roles, inputs, steps and output constraints. Text skills execute separately. Image Generation and Video Generation run as direct media skills from the Studio skills panel: they submit persistent generation jobs, place editable nodes on the canvas, and leave candidates for human selection. Images enter the text model's visual input; local videos provide extracted keyframes. Remote video requires native provider support or prior import.
- Actual FFmpeg MP4 export supports images, video, original video audio, independent audio tracks and Captions subtitles on a white background: up to 30 visual clips, 120 seconds, 720p/1080p. JSON project export remains available.
- Merchant posts a priced bounty → creator claims it → delivers work → merchant requests changes or accepts → payment webhook confirms earnings. Merchants access delivery files, not creators' private canvases. Each bounty currently allows one commission; cancellation does not automatically reopen it.
- Server prices are authoritative. Orders retain the purchased template snapshot. After payment, Orders' Use template applies it to an empty canvas. Signature verification, idempotent accounting, refund reversals, payout reservations and failure releases are implemented. External manually recorded payments do not create withdrawable balances.
- Legacy browser assets, templates and orders migrate to the server on first use. Failed asset/template operations retain local synchronization logs; canvas and skill requests retain recovery records. Cross-tab save conflicts are explicit rather than silently overwriting data.

## Startup and checks

```sh
npm ci
cp .env.example .env.local  # First setup only; preserve existing configuration
npm run db:migrate
npm run build
npm start -- --port 3002
```

`npm start` performs non-destructive migrations, then starts Next and queue recovery. `npm run dev` initializes the database on startup, but continuous recovery polling requires production start or a separate worker. Running `next start` directly requires `npm run worker` separately. Deployment needs a long-lived Node process and persistent disk; stateless functions that clear local storage are unsuitable. Install FFmpeg/FFprobe on the server; environment variables can specify executable paths.

```sh
npm test
npm run typecheck
npm run lint
npm run db:backup
npm run media:gc
npm run db:restore -- /absolute/path/to/backups/TIMESTAMP
```

Backups contain a consistent SQLite snapshot and private media. Restore writes to a new `data/restored-TIMESTAMP` without overwriting the current database. Stop the server, set `SPARKLE_DATABASE_PATH` and `SPARKLE_MEDIA_PATH` to the database and uploads paths printed by restore, then restart. Stop writes before backup so database and media snapshots share a business point in time. Migrations automatically back up the database before adding legacy-table fields. GC removes only media older than seven days without business references. Running processes must share database and media paths; do not run migrations concurrently.

`GET /api/health` checks database connectivity and configuration without exposing keys. Default local mode binds to 127.0.0.1 for personal-computer use. Public deployment requires accounts mode, HTTPS and account creation. The first account inherits existing personal data. Later registration is disabled by default; enable `SPARKLE_ALLOW_REGISTRATION` explicitly if needed. Passwords use scrypt; sessions store token hashes only; cookies use HttpOnly/SameSite=Strict. Reverse proxies should preserve actual request origins. Do not expose local mode publicly.

## Remaining provider integration

Text, image and video configuration is documented in `.env.example` and `docs/generation-providers.md`. Confirm provider protocols, image-size enums, video polling states and native video understanding against the chosen service. Generic request templates do not guarantee compatibility with every provider. Keys belong only in server environment variables. Daily call limits exist; monetary limits need provider pricing, and costs are not inferred.

Payments use a normalized gateway protocol, **not native Stripe, Alipay or WeChat SDK adapters**. Select payment and payout services whose adapter supplies the endpoints and signed callbacks below. Without configuration, no actual collection or payout is created. Automated ad placement, performance feedback, real-time collaboration, native video editing and music/TTS generation are outside this iteration. Agents provide plans and structured content, not automatically executed media tools.

### Payment gateway contract

- HTTPS `POST BASE_URL/checkout`: Bearer API_KEY; Idempotency-Key is the local payment.id. JSON contains id, orderId, sellerId, amountCents and currency:USD. Return `{id,url}` with an HTTPS URL. Provider return navigation should target `/commercial/orders`; navigation itself does not confirm payment.
- HTTPS `POST BASE_URL/payout`: the same authentication/idempotency headers. JSON contains id, amountCents, currency:USD and destinationId. The provider must verify and bind destinationId to the user; the adapter must check ownership and KYC. A client-supplied string is not a verified bank account.
- `POST /api/payments/webhook`: headers `x-sparkle-timestamp` (Unix seconds), `x-sparkle-signature` (HMAC-SHA256(secret, timestamp + '.' + raw JSON)); five minutes of skew allowed. JSON `{id,type,objectId,amountCents,currency:'USD'}` uses local payment/payout ID as objectId. Types: payment.succeeded, payment.failed, payment.refunded, payout.succeeded, payout.failed.
- Timeouts or uncertain responses retain submitting and prohibit new charges. The adapter must query the provider with the same idempotency ID and resend signed terminal events. This repository has no provider reconciliation credentials and cannot substitute for actual reconciliation.

The local frontend, backend and database are runnable. Paid generation, collection, refunds and payouts still require selected services and separate validation with sandbox and actual credentials. Local tests alone do not establish commercial launch readiness.
