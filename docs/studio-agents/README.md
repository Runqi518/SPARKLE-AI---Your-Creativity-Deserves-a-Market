# Sparkle Agents

Eight independent role workflows, each with its own objective, required inputs, execution steps, delivery format and checks. Definitions live in `src/lib/studio/agents/` and do not reference skill definitions.

| Agent | Independent deliverables |
| --- | --- |
| [Creative Director](creative-director.md) | Creative brief, direction tradeoffs, production tasks and acceptance criteria |
| [Scriptwriter](scriptwriter.md) | Opening candidates, timed script, voiceover and CTA copy |
| [Product Visual Designer](product-visual-designer.md) | Appearance specifications, hero and detail concepts, product prompts |
| [Character Designer](character-designer.md) | Character definition, performance direction, references and continuity constraints |
| [Scene Designer](scene-designer.md) | Environments, props, lighting, palette and scene prompts |
| [Storyboard Designer](storyboard-designer.md) | Timecoded storyboard, shot prompts and continuity checks |
| [Sound Director](sound-director.md) | Voice direction, music/effects timeline and mixing recommendations |
| [Final Editor](final-editor.md) | Editing timeline, captions, layout, export plan and acceptance criteria |

## Execution

After selecting a team through Add agent and sending a request, the backend creates a persistent run and immediately returns `202`. Roles execute in dependency order. Each selected role makes an independent text-model call and receives the original brief plus only its declared, selected and successfully completed dependencies. Unselected roles do not run automatically. Skills use the separate `/api/studio/skills/run` endpoint and do not start agents; both endpoints reject mixed submissions. The most recently used team or skill selection determines the input's execution mode, which is saved with the conversation. There is no bottom Agents / Skills toggle.

Each role returns structured JSON: `status`, `summary`, its own `sections`, `assumptions` and `questions`. The backend validates JSON, size, required sections and necessary questions before handing outputs to downstream roles. Models perform role-specific self-checks; format validation does not establish factual accuracy or advertising performance.

- Role states: queued → running → succeeded / needs_input / failed; unsuccessful dependencies produce blocked.
- Missing critical input produces questions and pauses dependent roles. Users send a new request after supplying information. No silent guessing or retries.
- Failure blocks only dependent roles. Independent roles continue and completed outputs remain available.
- Each submission carries a unique `requestId`. Retrying it returns the existing run; different content with the same ID returns `409`. Duplicate clicks or scheduling do not duplicate model calls.
- SQLite stores runs, original context snapshots, role states and outputs. Refresh restores state; reading records never reruns models.
- Interruptions and timeouts eventually mark runs failed. Late results cannot replace terminal states; configuration changes stop subsequent calls.
- The interface shows role status and expandable deliverables. Completed outputs can be added to the canvas individually.

## Endpoints

- `GET /api/studio/agents`: complete definitions for eight roles.
- `POST /api/studio/assist`: `requestId`, `projectId`, `prompt`, `agents` (names), optional `context` and `history`; returns `{run}`.
- `GET /api/studio/assist?projectId=...`: the latest 30 project runs.
- `GET /api/studio/assist/:id`: role states, outputs and errors.
- `POST /api/studio/skills/run`: `prompt`, `skills`, optional `context` and `history`; returns `{content}`.

Actual execution requires a configured text model. Agent tools currently produce scripts, visual prompts, storyboards, sound plans and editing plans through text-model calls. Canvas nodes handle image and video generation; these role workflows do not add audio synthesis, editing or publishing tools. Asset URLs alone do not automatically expose their visual content to the model. Production plans must not be described as completed films.

## Validation

`node --test tests/studio-providers.mjs` uses temporary SQLite and a loopback model to verify eight independent calls, dependency handoffs, skill separation, input/output validation, failures, missing input, idempotency, recovery and late-result protection. Mock models validate call chains and contracts, not real-model creative quality.
