---
name: video-generation
description: Generate shot-level motion using supported T2V, I2V and frame controls with explicit QC.
---

# Video Generation

- **Layer:** L3
- **Placement:** provider-spec
- **Implementation:** specification

## Professional model

Video generation must be shot-specific. Text-to-video offers broad exploration; I2V is useful when the first frame anchors identity; first/last-frame workflows can constrain endpoints where supported. These modes do not guarantee physically correct transitions or exact branded text. Keep each prompt’s action count low and verify temporal behavior across the whole clip.

## Required inputs and dependencies

- Approved shot card.
- Input and end frames.
- References.
- Model capability.
- Duration/aspect.
- Camera motion.
- Audio needs.
- Cost budget.
- Acceptance rubric.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Do not invoke unsupported controls.
2. Prefer short, single-action shots for exact product behavior.
3. Check start, midpoint and end plus rapid motion frames.
4. Keep a shot’s invariant state explicit.
5. Record seed or version when available.
6. Never mark a shot complete from a thumbnail.

## Operating procedure

1. Choose mode from visual-lock needs.
2. Confirm current parameters.
3. Compile prompt and inputs.
4. Submit with request ID.
5. Inspect response and asset existence.
6. Sample frames and playback at real speed.
7. Evaluate motion, physics, brand, continuity and audio.
8. Accept, targeted-repair or fallback according to attempt budget.

## Output contract

**Deliverable:** Shot generation record

**Required fields or sections:**
- input asset IDs.
- mode/provider/version.
- prompt.
- settings.
- output ID.
- sampled timecodes.
- defects.
- rubric scores.
- approval and attempt cost.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. Physics failure: simplify action or split shot.
2. Character drift: strengthen reference and reduce camera motion.
3. Transition mismatch: use a cut or insert instead of forcing a long interpolation.
4. API timeout: check saved state before retry.

## Evaluation rubric

Score 0–2 each: shot intent, identity, temporal/physical quality, artifact completeness. Pass at 7/8; brand mutation or unusable motion fails. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## Shot decomposition and mode choice

Break motion into shots whose action, camera and end state can be evaluated. Long multi-action prompts increase ambiguity: the model may omit an action, reverse order or drift identity. Use T2V for exploratory motion without fixed appearance, I2V when the entry frame anchors a product or character, and endpoint control only when supported and when both frames describe a physically plausible path. Audio generation, if available, has its own rights and sync checks.

| Failure risk | Preventive design | Inspection point |
| --- | --- | --- |
| Identity drift | Approved reference and limited camera/subject change | Every high-motion interval |
| Physics error | Simpler action, shorter duration, clear contact points | Action start, contact and result |
| Temporal discontinuity | Explicit entry/exit state and adjacent-shot context | First/last frames and cut boundary |
| Brand-text mutation | Exact source asset or post composite | All frames where text is visible |

## Acceptance procedure

Confirm request settings and reference transport before submission. An asynchronous job ID is a pending state, not a usable clip. After completion, verify playable file, dimensions, duration and asset persistence; inspect full-speed playback plus timecoded samples around the key action. Decide accept, targeted repair, alternate construction or stop under a recorded attempt budget. Store every candidate with the reason it was rejected. A technically smooth clip that fails the advertising proof beat is not accepted.

## Shot-level generation contract

Choose text-to-video, image-to-video or endpoint-controlled mode based on the required identity lock and shot transition. Confirm the provider's actual duration, aspect, reference and camera capabilities. Keep a shot to one principal action where practical, with observable start and end states. Use the approved first frame for product or character identity when possible; do not let a prompt invent exact branded lettering.

Inspect the whole clip at real speed and sample critical transitions. Check action order, physical interaction, product geometry, identity drift, camera path, audio and end-state continuity. A valid file may still fail the commercial shot contract. If the same defect recurs, simplify action, change acquisition mode or use compositing; do not burn the attempt budget repeating an unchanged prompt.
