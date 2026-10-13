# Optional Sparkle Python backend

The existing Next.js UI, TypeScript backend, generation providers, commercial
orders and startup commands remain unchanged. This independent service is not
automatically called by the UI and never reads or writes the existing app database.
Requires Python 3.9+, standard library only.

## Run

From the repository root:

```sh
export SPARKLE_API_TOKEN='replace-with-a-long-random-token'
python3 -m python_backend.service
```

Default: http://127.0.0.1:8790. Configuration: SPARKLE_PYTHON_PORT,
SPARKLE_PYTHON_HOST, SPARKLE_PYTHON_DATABASE, SPARKLE_ALLOWED_ORIGINS.
No environment file is loaded automatically. Database defaults to the new
python_backend/data/sparkle.sqlite3. No model credentials are required:
planning and analysis are deterministic, not model-generated content.

This local built-in HTTP server is a personal shared-token service, not
multi-user authentication. Keep it on loopback for local use. Public deployment
needs TLS, restricted access and a hardened transport. Existing Next.js auth
is not reused. Anyone with this service token can read or change these new jobs.

## APIs

GET /health is public; all other routes require Authorization: Bearer
SPARKLE_API_TOKEN. POST requires Content-Type: application/json.
Exact-origin CORS, 1 MB body limit and 120 requests/minute global limit apply.

| Endpoint | Input | Result |
| --- | --- | --- |
| POST /v1/briefs | product,audience,goal,facts?,channels?,cta? | Structured production plan |
| POST /v1/performance | variants,currency?,objective? | Per-variant and weighted aggregate metrics |
| POST /v1/jobs | requestId,kind,input | Saved queued task |
| GET /v1/jobs/ID | None | Persisted task with revision |
| POST /v1/jobs/run | id,revision | Run deterministic computation, save result |
| POST /v1/jobs/cancel | id,revision | Cancel queued task |
| POST /v1/jobs/recover | id,revision | Return failed/interrupted task to queued |

Brief channels: instagram, tiktok, youtube, square. Each plan contains format
dimensions, hook/proof/CTA directions, verified facts and human-review checks.
Dimensions are editable production targets, not a guarantee of current platform
ad-spec compliance. Missing facts are flagged instead of invented.
No images, video, media uploads or campaign publication are performed.

Performance objectives: conversions (lowest observed CPA), clicks (highest
observed CTR), revenue (highest observed ROAS). Each variant has id, impressions,
clicks, conversions, spend, revenue. Counts are nonnegative integers;
currency amounts use the same supplied currency and reporting window.
Use click-attributed conversions with conversions <= clicks <= impressions.
View-through attribution is not supported by this endpoint.
All submitted amounts must already be in the same currency; no FX conversion
or cross-channel attribution reconciliation is performed.
Undefined ratios return null, not zero; totals use aggregate numerators and
denominators rather than averaging rates. lowSample flags limited volume.
Ranking is descriptive, not a significance test or automatic budget decision.

Example:

```json
{
  "variants": [
    {"id":"poster-a","impressions":2000,"clicks":80,"conversions":8,"spend":40,"revenue":120},
    {"id":"poster-b","impressions":2000,"clicks":60,"conversions":4,"spend":40,"revenue":60}
  ],
  "currency": "USD",
  "objective": "conversions"
}
```

Jobs support kind brief or performance. requestId is idempotent: submitting the
same kind/input returns the existing task; reusing it with changed inputs returns
409. SQLite persists across restarts. Writes use atomic revision checks;
stale transitions return 409. Run moves queued -> running -> completed.
Cancellation only applies to queued jobs. Recover is an explicit operator action
for failed or interrupted computations; there is no automatic queue worker.
Run is synchronous. These tasks are bounded local computations with no provider
billing or external effects. This is not a replacement for existing media jobs.

## Validation

```sh
python3 -m unittest python_backend.test_core python_backend.test_sparkle -v
npm run lint
npm run typecheck
npm test
```

Tests cover HTTP, authorization, concurrency, persistence, revisions,
idempotency, cancellation/recovery, metrics and production plans.
No paid provider requests or ad spending occur.

## GitHub language display

This remains a mixed-language project, including the original TypeScript backend.
The newly added root .gitattributes excludes TS/JS, CSS and HTML from language
totals so Python is presented as primary. This is a deliberate presentation scope,
not natural whole-repository byte dominance or a language certification.
Syntax highlighting and original source stay intact; no dummy code or
misclassification is used. Remove this new .gitattributes to restore default stats.
GitHub updates cached language statistics after changes reach the default branch.
