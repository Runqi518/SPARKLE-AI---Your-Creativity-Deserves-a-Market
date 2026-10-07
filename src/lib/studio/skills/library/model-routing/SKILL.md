---
name: model-routing
description: Choose an image, video or audio provider from current capabilities, quality needs and cost.
---

# Model Routing

- **Layer:** L3
- **Placement:** runtime-spec
- **Implementation:** specification

## Professional model

Model routing is a runtime service because it depends on live provider APIs, pricing, availability, rights and account configuration. Fixed vendor-to-shot rules become stale. Use task-specific capability gates before subjective quality rankings; leaderboard scores provide comparative evidence but do not establish performance on the user’s product and motion.

## Required inputs and dependencies

- Shot type and acceptance criteria.
- Current enabled providers.
- Feature matrix.
- API mode/spec version.
- Price/latency.
- Privacy and rights restrictions.
- Reference assets.
- Historical local outcomes.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Reject providers missing mandatory mode, aspect, duration, reference or audio controls.
2. Rank eligible providers on product fidelity, motion/physics, latency and cost using explicit weights.
3. Preserve a fallback with a different failure profile.
4. Consider image-first plus animation when exact pack appearance dominates.
5. Require a small benchmark on representative shots before large batch generation.

## Operating procedure

1. Query current provider metadata.
2. Form mandatory and preferred requirements.
3. Filter incompatible models.
4. Estimate total attempts and cost.
5. Pick primary and fallback.
6. Run a representative sample.
7. Score outputs against the shot rubric.
8. Update routing history with date, provider version and observed results.

## Output contract

**Deliverable:** Routing decision

**Required fields or sections:**
- shot_id.
- required_capabilities.
- eligible_models.
- disqualifications.
- weighted_scores.
- primary.
- fallback.
- expected cost/time.
- validation sample.
- current spec links.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. No eligible model: return a revised production option such as still+edit or live-action pickup.
2. Unsupported parameter: repair request without charging retries.
3. Changing provider specs: invalidate cached capability.
4. Leaderboard mismatch: prioritize local sample.

## Evaluation rubric

Score 0–2 each: capability fit, evidence, cost transparency, fallback quality. Pass at 7/8; claiming live availability from a static document fails. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## Capability gates before ranking

Model choice starts with **hard requirements**: input mode, reference count, frame controls, aspect ratio, duration, output format, audio behavior, rights and account availability. A provider that fails a hard requirement is ineligible regardless of leaderboard rank. Only after filtering should the runtime compare quality, latency, price and reliability. Record the date and model version for every capability claim; static routing folklore becomes obsolete quickly.

| Shot requirement | Routing consequence | Evidence |
| --- | --- | --- |
| Exact packaging identity | Prefer modes accepting an approved image or a compositing path | Local reference-preservation sample |
| Complex physical action | Compare motion/physics performance on representative shots | Direct media inspection, not aggregate score alone |
| Controlled start and end state | Use endpoint mode only if connector and provider expose it | Current API documentation and test response |
| Tight budget or deadline | Estimate attempts, queue latency and fallback cost | Recent local history and current pricing |

## Local benchmark protocol

Choose a small, representative subset that stresses the campaign's actual risks, not only easy beauty shots. Hold reference quality, duration and acceptance rubric constant when comparing providers. Score product fidelity, action coherence, usable frames, audio and cost per accepted shot. A high aggregate benchmark score may be irrelevant if the campaign depends on exact typography. Persist failure types as well as wins; the fallback should have a different failure profile. When no provider qualifies, route the creative plan toward stills, practical footage, compositing or a simpler action rather than fabricating compatibility.

## Capability gate before preference

Route a shot by required input mode, character or product locking, camera control, duration, aspect ratio, audio needs, rights and cost ceiling. Check live connector and account capability rather than relying on public feature descriptions. Use quality comparisons only after hard requirements pass. A highly rated model that cannot accept the approved reference or return a usable asset is not a viable route.

Record provider choice, rejected alternatives, current specification source, expected cost and fallback. Pilot the highest-risk shot early to test identity and motion, then update route assumptions from actual output. If all available models fail a hard constraint, revise the production method, use live action/compositing or escalate the limitation; do not claim a prompt workaround can supply an absent API control.
