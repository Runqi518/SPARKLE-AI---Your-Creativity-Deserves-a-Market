# Local Generation Providers

Sparkle's studio backend supports independently configured text, image and video providers. It does not fall back to Moyu, legacy environment variables, fake assets, or simulated success. It returns **candidates**, never writes a result into a canvas, and supports `projectId: "demo"` without creating a project.

The Studio skills panel exposes Image Generation and Video Generation as direct media operations. Run one media skill at a time, choose a configured model and settings, and optionally reference existing canvas nodes. The client creates a linked image or video node and submits it through `POST /api/studio/generations` with `mediaSkillId`. The server validates that the skill matches the node kind, applies the corresponding production guidance from its `SKILL.md`, persists the job, and returns candidates for explicit review and application. Other standalone skills remain text workflows; media skills cannot be attached to text-only agent runs.

## Setup

For media-only setup, copy `.env.local.example` to `.env.local`, fill in the selected providers' values, and restart Next. Keep `.env.local` out of Git; the committed example deliberately has empty API keys. `.env.example` lists every supported option. Existing `.env` credentials are not copied or used by these studio routes. Never use `NEXT_PUBLIC_` for provider configuration.

For each desired kind, supply `SPARKLE_TEXT_BASE_URL`, `SPARKLE_TEXT_API_KEY`, `SPARKLE_TEXT_MODEL`, or the equivalent `SPARKLE_IMAGE_*` / `SPARKLE_VIDEO_*` variables. All three are required; a provider with missing/invalid configuration is unavailable. `MODELS` is an optional comma-separated model allowlist; `MODEL` is always included. There is no dynamic model discovery or provider network call from the providers route.

Example with **placeholder values only**:

```dotenv
SPARKLE_TEXT_BASE_URL=https://your-text-host.example/v1
SPARKLE_TEXT_API_KEY=replace-locally
SPARKLE_TEXT_MODEL=your-text-model
SPARKLE_TEXT_MODELS=your-text-model,your-other-model
SPARKLE_IMAGE_BASE_URL=https://your-image-host.example/v1
SPARKLE_IMAGE_API_KEY=replace-locally
SPARKLE_IMAGE_MODEL=your-image-model
SPARKLE_VIDEO_BASE_URL=https://your-video-host.example/api
SPARKLE_VIDEO_API_KEY=replace-locally
SPARKLE_VIDEO_MODEL=your-video-model
```

The base includes any API prefix, such as `/v1`. Relative endpoints **append to the base**, including endpoints starting with `/`: base `https://host/v1` and endpoint `/images/generations` produce `https://host/v1/images/generations`. Absolute HTTP(S) endpoints are also accepted and receive the configured credential. Configure only trusted provider endpoints. Redirects are rejected, not followed with credentials. HTTP is supported for local adapters; use HTTPS outside localhost.

## HTTP Contract

The exact request and public TypeScript types are defined in `schemas/studio-generation.ts` and are imported by the implementation.

| Endpoint | Response | Behavior |
| --- | --- | --- |
| `GET /api/studio/providers` | `{ providers: ProviderSummary[] }` | Exactly this top-level field; each item contains `kind`, `configured`, `models`, `defaultModel`. No addresses, templates, keys, or provider calls. |
| `POST /api/studio/generations` | `202 { job: StudioJob }` | Validates input, persists a queued job, schedules one submission using Next `after`, and returns before the provider finishes. |
| `GET /api/studio/generations/[id]` | `{ job: StudioJob }` | Returns persisted status and, when due, makes one bounded status call for an asynchronous video. |
| `GET /api/studio/generations?projectId=demo` | `{ jobs: StudioJob[] }` | Up to 100 newest jobs, newest first; expires interrupted jobs without calling providers. |
| `POST /api/studio/assist` | `202 { run }` | Persisted independent agent run: requestId, projectId, prompt, agents, context and history. No skills accepted. See [agent workflows](studio-agents/README.md). |
| `GET /api/studio/assist/:id` | `{ run }` | Poll per-agent status, results and input requirements without resubmitting. |
| `POST /api/studio/skills/run` | `{ content: string }` | Separate skills-only execution: prompt, skills, context and history. No agents accepted. |

Generation request:

```json
{
  "requestId": "9811f271-c2fb-4369-94d8-15cb7d3bc5e1",
  "projectId": "demo",
  "nodeId": "draft",
  "snapshot": {
    "nodes": [
      {
        "id": "brief",
        "type": "asset",
        "position": { "x": 0, "y": 0 },
        "data": { "kind": "text", "label": "Brief", "content": "A quiet product launch." }
      },
      {
        "id": "draft",
        "type": "asset",
        "position": { "x": 350, "y": 0 },
        "data": { "kind": "text", "label": "Write three short hooks" }
      }
    ],
    "edges": [{ "id": "brief-draft", "source": "brief", "target": "draft" }]
  },
  "options": {
    "aspectRatio": "16:9",
    "resolution": "1K",
    "duration": 5,
    "count": 1
  }
}
```

Options follow the shared schema: optional allowlisted `model` (maximum 160 characters); `aspectRatio` is `1:1`, `16:9`, `9:16`, `4:3` or `3:4`; `resolution` is `720p`, `1080p`, `1K` or `2K`; `duration` is an integer from 1 to 60; `count` is an integer from 1 to 4. The options object is required, but its individual fields use schema defaults. These controls are sent/mapped to providers; they do not guarantee that every model supports every setting.

`StudioJob` contains only `id`, `projectId`, `nodeId`, `kind`, `status`, `candidates`, optional `error`, `createdAt`, and `updatedAt`. Status is `queued`, `running`, `succeeded`, or `failed`. Each candidate contains a generated `id`, `kind`, and `content` or `url`. Internal request IDs, input hashes, configuration hashes, models, provider job IDs, leases and deadlines are never returned. Date fields are ISO timestamps. All generation/provider responses have `Cache-Control: no-store`.

On refresh, list jobs by project, group by `nodeId`, and restore per-node state from the newest relevant job. Poll queued/running job IDs using the detail endpoint, stopping on a terminal state. Listing is not a global scheduler and does not poll videos in bulk. Treat a candidate as an explicit user choice; applying it to the canvas remains a frontend action. The 100-job recovery window is not a complete history/export API.

Expected errors use `{ error: string }`: `400` for invalid JSON/schema/graph/model/references, `403` for cross-origin browser submissions, `404` for an unknown real project/job, `409` for request-ID conflicts, `413` for oversized input, `415` for non-JSON submissions, `503` for missing/invalid configuration. Assistant provider errors return `502`. Once a generation has been accepted, provider errors normally become a persisted `failed` job with a safe error message. Restore changed video configuration if a poll returns `503`.

## Context And Validation

The supplied snapshot is authoritative for generation, including unsaved edits. Real project IDs are checked using `getProject`; their stored canvas is not substituted for the supplied snapshot. Nodes are resolved by `data.kind`, then shipped legacy `data.nodeKind`/`data.type`. Only text/image/video target nodes can generate; audio nodes may remain elsewhere in the canvas.

The entire graph is checked for duplicate IDs, dangling edges and cycles, including disconnected subgraphs. All transitive ancestors are collected in topological order, deduplicating diamonds. Ancestor content/labels/captions become prompt context. Image/video `url` (or shipped legacy `resultUrl`) fields become typed reference arrays. The target's existing media is also a reference. Unrelated nodes are not included. Target prompt precedence is `prompt`, `content`, `caption`, `label`.

Bounds: 1 MiB JSON request, 1-200 nodes, at most 1,000 edges, IDs up to 160 characters, positions within +/-1,000,000, node data up to 64,000 serialized characters, label up to 500 characters, content/prompt/caption/URL up to 20,000 characters each, assembled context up to 60,000 characters, at most 16 reference entries before deduplication. Invalid inputs never submit to a provider. A missing/unreadable local upload can fail the accepted job during preparation, still before any provider call.

## Default Provider Protocols

### Text

Default `POST /chat/completions` sends JSON `{ model, messages, n }`. `messages` includes the role prompt as `system` and the assembled context as `user`. With image references, the user message uses OpenAI-style `text` and `image_url` content parts. Video references require an explicit custom template/protocol; the default chat payload does not attach video files.

Default `OUTPUT_PATH=choices.0.message.content`. The mapped output must be a nonempty string or array of nonempty strings (each at most 100,000 characters). The default path reads only the first chat choice even if `n > 1`; configure an adapter/provider response that exposes a string array to return multiple text candidates. Dotpaths deliberately do not evaluate scripts, wildcards or mapping expressions. Assistant requests always ask for one text result.

### Image

Default `POST /images/generations` sends `{ model, prompt, n, size }` and an `image` field with the first reference when available. Many image-generation endpoints do **not** support an `image` field: use a JSON-compatible editing endpoint and `REQUEST_TEMPLATE` matching that provider. Multipart-only image editing needs an adapter.

Default sizes are `1024x1024` for square, `1024x1536` for portrait and `1536x1024` for landscape. The default image protocol has no separate resolution field; a template can use `resolution`/`aspectRatio` instead. This is an explicit default mapping, not a promise of exact output dimensions.

Default `OUTPUT_PATH=data`, `URL_PATH=url`, `B64_PATH=b64_json` reads an array of objects such as:

```json
{ "data": [{ "url": "https://cdn.example/output.png" }, { "b64_json": "BASE64_PNG_BYTES" }] }
```

URL results must be absolute HTTP(S) URLs without embedded user/password credentials. Base64 results must be canonical base64 **PNG** bytes, not JPEG, WebP, or a data URL. PNG signature/chunk structure, dimensions and size are checked: at most 10 MiB, 16,384 per dimension, and 40 million pixels. Generated files are exclusively created under `public/uploads/generated-<uuid>.png`; no provider-supplied filename is used. URLs are returned as `/uploads/...`. Other binary formats or binary HTTP responses require an adapter; this backend does not pretend to transcode them. Returned HTTP URLs are not downloaded, and CDN availability/expiry remains the provider's responsibility.

### Video

Default `POST /videos` sends JSON:

```json
{
  "model": "configured-model",
  "prompt": "assembled context and prompt",
  "n": 1,
  "aspect_ratio": "16:9",
  "resolution": "1K",
  "duration": 5,
  "images": [],
  "videos": []
}
```

A synchronous result can be `{ "url": "https://cdn.example/clip.mp4" }`. An asynchronous result can be `{ "id": "provider-task-id", "status": "queued" }`. The provider ID is saved before returning control from submission. Default polling is `GET /videos/{{jobId}}`, with the ID URL-encoded. Poll responses use `status` and `url`; for example `{ "status": "completed", "url": "https://cdn.example/clip.mp4" }`.

Success states default to `succeeded,completed,success`; failure states default to `failed,error,cancelled,canceled`, matched case-insensitively. Failure wins even if a URL is present. A configured success state without a valid URL is a failure. A URL without a state is accepted as synchronous success. Unknown/nonterminal states wait until the next poll or job deadline. A status mapping typo cannot remain running indefinitely.

## Configurable JSON Mapping

All three prefixes support `BASE_URL`, `API_KEY`, `MODEL`, `MODELS`, `ENDPOINT`, `REQUEST_TEMPLATE`, `OUTPUT_PATH`, `AUTH_HEADER`, `AUTH_SCHEME`, `TIMEOUT_MS`, `JOB_TIMEOUT_MS`, and `MAX_RESPONSE_BYTES`.

`AUTH_HEADER` defaults to `Authorization`; `AUTH_SCHEME` defaults to `Bearer`. Set `AUTH_SCHEME=none` for raw-key headers such as `x-api-key`. Authentication stays in server configuration, not templates. Do not place credentials in model names or template literals.

`REQUEST_TEMPLATE` must be a JSON object (up to 32,000 characters), typically single-quoted in dotenv. A string consisting entirely of `{{variable}}` is replaced with its native JSON value, preserving arrays, numbers and null. Embedded placeholders interpolate into strings. An unknown placeholder is a configuration error. No code, JavaScript expressions or environment variable lookup is evaluated.

Supported submission variables:

| Variable | Type / meaning |
| --- | --- |
| `model` | Selected allowlisted model |
| `prompt` | Assembled context/request text |
| `rolePrompt` | System/role instructions |
| `messages` | OpenAI-compatible system/user message array |
| `count`, `duration` | Numbers |
| `size`, `aspectRatio`, `resolution` | Strings |
| `images`, `videos` | Arrays of resolved media references |
| `image`, `video` | First reference, or null |

Poll templates provide `jobId` and `model`. Use `POLL_METHOD=POST` with `POLL_REQUEST_TEMPLATE` if needed; default POST poll body is `{ "id": "provider-id" }`. GET polls have no body. Poll endpoint substitution supports `{{jobId}}` only.

Response paths are simple dot-separated object fields/array indices, e.g. `result.files.0.url`. `$` means the root value. Prototype-related path segments are not resolved. Image `URL_PATH` and `B64_PATH` are relative to each item selected by `OUTPUT_PATH`. Video `URL_PATH` handles objects in an output array. A mapped video output may be one URL string or an array of URL strings/objects. No raw provider body is persisted or returned.

Example custom JSON provider:

```dotenv
SPARKLE_IMAGE_ENDPOINT=/render
SPARKLE_IMAGE_REQUEST_TEMPLATE='{"model_id":"{{model}}","description":"{{prompt}}","references":"{{images}}","ratio":"{{aspectRatio}}","quality":"{{resolution}}","num_images":"{{count}}"}'
SPARKLE_IMAGE_OUTPUT_PATH=result.images
SPARKLE_IMAGE_URL_PATH=download_url
SPARKLE_IMAGE_B64_PATH=png_base64

SPARKLE_VIDEO_ENDPOINT=/tasks
SPARKLE_VIDEO_REQUEST_TEMPLATE='{"model":"{{model}}","input":{"text":"{{prompt}}","image_urls":"{{images}}","video_urls":"{{videos}}"},"seconds":"{{duration}}"}'
SPARKLE_VIDEO_JOB_ID_PATH=task.id
SPARKLE_VIDEO_STATUS_PATH=task.state
SPARKLE_VIDEO_OUTPUT_PATH=task.output.url
SPARKLE_VIDEO_POLL_ENDPOINT=/tasks/status
SPARKLE_VIDEO_POLL_METHOD=POST
SPARKLE_VIDEO_POLL_REQUEST_TEMPLATE='{"task_id":"{{jobId}}"}'
SPARKLE_VIDEO_POLL_OUTPUT_PATH=task.output.url
SPARKLE_VIDEO_SUCCESS_STATUSES=done
SPARKLE_VIDEO_FAILURE_STATUSES=rejected,failed
```

Providers needing multipart, SSE, binary responses, SDK signing, multiple authentication keys, webhooks-only completion, or more complex transformations need a small JSON adapter. Configurable JSON does not claim universal protocol compatibility.

## References And Storage

Remote HTTP(S) references are passed to the provider without server-side downloading. That avoids using this server as an arbitrary URL fetcher; the provider must be able and permitted to access the URL. Private signed URLs may still be confidential to the user/provider; do not treat them as public credentials to publish.

Local references must be direct files under `/uploads/` with safe filenames and a supported image/video extension. Traversal, percent-encoded traversal, file URLs, arbitrary absolute paths, user-supplied data URLs, nested directories and symlinks are rejected. The two bundled demo images `/studio-product.svg` and `/studio-object.svg` are explicitly allowed; a provider that cannot consume SVG needs a raster upload instead. Uploaded file MIME is inferred from the approved extension; this route does not fully decode/transcode reference media.

With `SPARKLE_PUBLIC_URL` blank, local media becomes a data URL, capped at 10 MiB per reference. With a publicly reachable app origin configured, existing local media becomes `SPARKLE_PUBLIC_URL + /uploads/...` and can exceed the inline limit. Do not set this to `localhost` for a remote provider. Larger video references generally need a public URL. Generated media requires a writable, persistent `public/uploads` directory and a deployment that serves newly created files; ephemeral/static deployments are not supported.

## Persistence And Failure Semantics

`src/lib/studio/jobs.ts` reuses the existing Sequelize connection but defines its own `StudioGenerations` table and memoized explicit `StudioGeneration.sync()` helper. It does not modify the existing database module or migrations, and never uses `alter` or `force`. SQLite and uploads must persist together. Existing project deletion does not cascade to this independent table; a future authenticated retention/cleanup feature must handle these jobs/assets explicitly.

`requestId` is globally unique in the database. The parsed request is canonically hashed, including project, node, snapshot and options. Replaying the same input returns the existing job with `202`, including a terminal failure; different input with the same ID returns `409`. Raw snapshots/prompts, provider credentials and request payloads are **not** stored in this table. Explicitly choosing to try again requires a new request ID and may incur a new charge.

Database conditional updates claim queued submissions and status polls, including across module reloads/processes sharing SQLite. Submission is attempted once only. A crash before provider-ID persistence is ambiguous and may already have incurred a charge; it is never automatically resubmitted. Stale queued jobs expire after 30 seconds; interrupted running submissions expire after the configured request timeout plus 15 seconds. Recovery reads mark them failed. Async videos retain the provider ID and can continue status polling after refresh/restart.

`TIMEOUT_MS` defaults to 60,000 and is bounded to 100-120,000; it covers fetch and response-body reading. `JOB_TIMEOUT_MS` defaults to 900,000 and is bounded to 1,000-86,400,000 from acceptance. `SPARKLE_VIDEO_POLL_INTERVAL_MS` defaults to 3,000 and is bounded to 100-60,000. `MAX_RESPONSE_BYTES` defaults to 20,000,000 and is bounded to 1,024-64,000,000. Next routes declare a 180-second maximum duration to accommodate the bounded submission/status request, but platform limits must also permit that duration.

Poll claims are persisted as leases. Concurrent polls do not duplicate requests; a crashed poll can be reclaimed after its request timeout plus poll interval. Known HTTP/JSON/timeout failures from polling fail the job rather than imply success. Provider settings are fingerprinted, without persisting the settings themselves; changing configuration, including the credential/model, blocks existing video polls with `503` until the original configuration is restored. This prevents polling a paid job at a different endpoint by accident. Overall deadlines still apply.

No raw provider errors are logged or returned. Known configured API keys and their URL-encoded forms are redacted from text output, and rejected in output/reference URLs and model names. This is defense in depth, not general-purpose secret detection: user-supplied prompt content and signed provider asset URLs can themselves be sensitive. Keep access to the local app, SQLite, logs and uploads private.

This is a **single-user local MVP**, not a public multi-tenant service. There is no account authorization, durable external worker, cancellation, provider-side exactly-once guarantee, quota/rate limiting, automatic cleanup or automatic paid retry. Browser cross-origin submissions are rejected, but network clients are not authenticated. Do not expose the app publicly without authentication, authorization, rate limits and storage controls. `after` is a Next-managed post-response callback, not a durable queue; interrupted submissions are surfaced honestly rather than silently replayed.

## Verification

```sh
node --test tests/studio-providers.mjs
npx eslint src/lib/studio src/app/api/studio/assist/route.ts src/app/api/studio/providers/route.ts src/app/api/studio/generations tests/studio-providers.mjs
npx tsc --noEmit --incremental false
```

The integration runner uses the installed TypeScript compiler in memory, actual route handlers, real Sequelize/SQLite, and a fake HTTP provider bound only to loopback. Next's `after` lifecycle is shimmed with an explicitly drained post-response queue; this tests scheduling and claims without starting or changing the user's dev server. It is not a deployed Next lifecycle/browser test. The suite changes cwd to a newly created temporary directory before loading the existing database module, clears `SPARKLE_*` in the test process, never loads dotenv files, and rejects non-loopback fetches. It leaves its own SQLite/upload artifacts for inspection and never deletes user data.

Coverage includes safe missing-config responses, graph/schema/bounds validation, real-project existence and unsaved snapshots, default/custom text/image/video JSON protocols, system-role assistance, transitive context, local and remote references, generated PNGs, synchronous/asynchronous video, concurrent idempotency, poll deduplication, reload recovery, interrupted/expired jobs, malformed responses, timeouts, provider failures and credential non-exposure. Main/frontend browser tests are separate.
