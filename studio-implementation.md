# Sparkle Studio

## Preview

- Start creating: http://localhost:3001
- Example canvas: http://localhost:3001/project/demo
- Templates: http://localhost:3001/commercial/market
- My templates and per-work Content matching: http://localhost:3001/commercial/market?view=own
- Bounties (stored merchant subjects): http://localhost:3001/commercial/subjects
- Demo orders: http://localhost:3001/commercial/orders
- Asset library: http://localhost:3001/assets

There is no marketing landing page. The root route is the project workspace.
The examples use port 3001; they do not imply a server is currently running.

## Design Sources

Navigation retains three creation choices, template creation containing the reference-ad entry, and collapsible navigation and AI panels. The current commercial navigation is **Marketspace** (one word): Templates -> `/commercial/market`, Bounties -> `/commercial/subjects`, Orders -> `/commercial/orders`. Content matching is an action on each work in My templates, not a standalone navigation item.

The supplied Figma file was inspected in the browser. The UI uses its verified neutral colors: `#F4F4F5`, `#0F0F11`, `#1B1C1E`, and `#FFFFFF`, with opacity-derived borders, shadows and glass surfaces. No unrelated accent color has been introduced. The two SVG concept images are original placeholder artwork in the same neutral palette, not Figma exports or generated advertisements.

Jimeng informed the floating canvas tools and separate media elements. The accessible MiniMax Design website informed the light dot-grid surface; its desktop application was not installed or inspected.

## Working Features

- Template creation, basic creation and free creation with distinct starting canvases.
- Basic text-to-video, image-to-video and existing-video setups.
- React Flow canvas with freely positioned editable nodes, directed connections, selection, panning, zoom, fit, undo and redo. Connections express generation dependencies rather than forcing a fixed linear layout.
- Text, image, video and audio elements with edit, asset and AI-context actions.
- Manual text editing, media replacement, duplication and deletion.
- Media upload with a 20 MB limit and an allowlist of supported formats.
- Separate agent and skill controls in the conversation panel.
- Text assistance through the independently configured text provider. Selected roles, skills and text context are included in the request; there is no fallback to legacy Moyu credentials.
- Five editable timeline lanes. Start time, duration and lane are saved in element data.
- Visual sequence preview with a playhead, plus native controls for uploaded video and audio.
- Server-backed project storage and browser recovery copies for edits made shortly before navigation.
- Editable JSON project export.
- Local template search, category filtering, details and reuse. My templates contains saved snapshots and workspace projects not yet saved as templates, with published/unpublished states and per-work Content matching.
- Saving a workspace project as a draft or publishing it snapshots its latest server-saved nodes and edges. Editing a saved template preserves that snapshot, including prompts and generation options; it does not silently refresh it from the source project. Unpublishing keeps the draft and removes it from the storefront.
- Template reuse passes nodes and edges to `newProject`; explicit empty edge arrays stay empty. Bundled example templates use the example graph. Old saved templates without edges remain unconnected, and old explicitly published templates without a publication flag remain listed.
- Brand-subject creation and creation of projects linked to the selected subject.
- Keyword-based content matching against stored brand subjects.
- Bounties load only stored subjects from `/api/subjects`; an empty database shows an empty state, not fictional briefs or rewards.
- Explicit demo template orders with no charges or payment provider.
- Asset reuse in both new and existing projects.
- Project deletion with explicit confirmation and a database transaction.
- Desktop and mobile layouts. The AI panel is closed by default on mobile.

## Current Boundaries

This is a functional product-workspace MVP, not a deployed ad-production or commerce service.

- The nine agent options configure specialist perspectives in one text-assistance request. The editable DAG supplies upstream context for node generation; it is not an automatic multi-agent scheduler. Independent agent workers, quality evaluation and automatic end-to-end video production are not implemented here.
- Text, image and video generation use the studio provider backend when configured. Each generatable node has its own prompt and options; results are candidates that require an explicit user choice before replacing the node content. Audio supports upload and playback only, not audio generation.
- Reference-ad import is manual. Automated video deconstruction is not connected.
- The timeline saves composition metadata and previews visual sequencing. It is not a frame-accurate audiovisual renderer, and it does not export MP4 or mix audio.
- Motion graphics skills currently assist with text planning, not graphical animation rendering.
- Templates, demo orders, chat and the asset-library index are stored in the current browser. They are not shared across accounts or devices.
- Matching is a disclosed keyword filter, not an AI recommendation service.
- The storefront combines a disclosed example catalog with browser-local published templates. Bounties are user-created merchant briefs, not paid commissions. There are no real licenses, payouts, payment processing or marketplace moderation. Provider generation can still incur charges from the configured provider.
- No authentication or multi-tenant isolation has been added. Run this preview locally, not as a public service.

## Storage

- Existing SQLite database: projects, canvas snapshots and brand subjects.
- `public/uploads`: locally uploaded media. Excluded from Git.
- Browser storage under the `sparkle:` prefix: local templates, activity, chat, library metadata and pending-edit recovery.
- `/project/demo`: example canvas stored in the browser only.
- Studio generation jobs: the independent SQLite `StudioGenerations` table; generated PNG files may be stored under `public/uploads`. Remote media URLs remain provider-hosted and may expire.

Project deletion explicitly deletes legacy generation jobs and canvases inside a transaction. It does not cascade to the independent `StudioGenerations` table or remove uploaded/generated media; retention and cleanup remain future work.

## Generation Contract

The full configuration, HTTP protocols, validation bounds and failure semantics are documented in [generation-providers.md](generation-providers.md). `schemas/studio-generation.ts` is the shared request/type contract.

- `GET /api/studio/providers` exposes configuration availability and model choices only, never credentials or endpoint addresses.
- `POST /api/studio/generations` accepts a request ID, project/node IDs, the current nodes/edges snapshot (including unsaved edits), and options, returning `202 { job }`.
- The backend rejects duplicate IDs, dangling edges and cycles across the whole graph. It collects transitive ancestors in topological order as text context and typed image/video references; unrelated nodes are excluded.
- `GET /api/studio/generations?projectId=...` restores up to 100 recent jobs. The job detail endpoint polls queued/running jobs until succeeded or failed; async video status calls are bounded and persisted. This is not a durable external worker or an SSE subscription.
- Generated candidates never automatically overwrite accepted canvas content. Applying a candidate is a frontend action. Manual edits, asset replacement and local node changes remain possible without generation.
- Model, ratio, resolution, duration and candidate-count options are mapped to provider protocols; actual support depends on the configured model/adapter. No credentials, missing configuration or provider failure is replaced with fake output.

The old shipped `/commercial/match` route redirects to `/commercial/market?view=own`; `/commercial/bounties` redirects to `/commercial/subjects`. Unknown commercial sections remain 404s. No additional compatibility routes are introduced.

## Run

```bash
npm ci
npm run dev -- --port 3001
```

The local `.env.local` has blank provider configuration fields. Populate only the desired `SPARKLE_TEXT_*`, `SPARKLE_IMAGE_*` and `SPARKLE_VIDEO_*` settings locally, then restart Next. Each kind requires `BASE_URL`, `API_KEY` and `MODEL`; `MODELS` is an optional allowlist. The portable `.env.example` is intentionally not ignored, while `.env.local` remains ignored. Never put provider secrets in `NEXT_PUBLIC_*` variables. See the provider guide for endpoint/request/response mappings and local-reference handling. No secrets were read for this documentation update.

## Verification

The commands below are verification instructions, not a passing report for the latest changes. Main must finish the Canvas integration and run current build, type, lint, provider and browser checks before marking this revision verified.

```bash
npm run build
npx tsc --noEmit --incremental false
npx eslint src/components/studio src/app/api/studio tests/studio.browser.mjs
```

`tests/studio.browser.mjs` is a Playwright smoke suite. It uses an isolated Chrome profile and a running local server. Install Playwright in your development environment or set `PLAYWRIGHT_MODULE` to an existing installation, then run:

```bash
node tests/studio.browser.mjs
```

Optional environment variables: `STUDIO_URL`, `CHROME_PATH`, `PLAYWRIGHT_MODULE`, and `SCREENSHOT_DIR`. The existing smoke suite is not evidence that the latest Marketspace and connected-generation paths pass. Verify graph snapshot/reuse, draft/publish/unpublish filtering, per-work matching, both legacy redirects, provider failures and explicit candidate application on desktop and mobile. Provider contract tests are described separately in the provider guide; do not make paid requests as part of an unapproved smoke run.

## Desktop Copy

Location: `/Users/lirunqi2/Desktop/Sparkle-Studio-2026-10-05`.

This is a previously recorded copy location, not a claim that the current revision has been copied or verified there. No desktop copy was updated as part of the Marketspace changes.
