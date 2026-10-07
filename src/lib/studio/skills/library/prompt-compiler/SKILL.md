---
name: prompt-compiler
description: Compile a shot plan into concise, model-compatible prompts and control inputs.
---

# Prompt Compiler

- **Layer:** L3
- **Placement:** standalone
- **Implementation:** operational

## Professional model

A model prompt is an execution contract, not a compressed creative deck. For image-to-video, the image usually establishes identity and visual composition while text should specify intended motion; Specify motion in simple, direct language and iterate one variable at a time. Keep invariant identity in references and vary one motion variable at a time.

## Required inputs and dependencies

- Approved shot card.
- Product/person/scene reference IDs.
- Exact model and mode.
- Duration/aspect ratio.
- Motion goal.
- Prohibited changes.
- Provider current capability document.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Choose text-to-video only when appearance can be newly synthesized.
2. Choose image-to-video when identity or pack fidelity matters.
3. Use first/last frames only if current provider supports it.
4. Describe observable subject, camera and scene motion.
5. Avoid conflicting directives such as “locked camera” and “orbit” in one shot.

## Operating procedure

1. Read the shot’s narrative purpose and invariant states.
2. Inspect reference assets.
3. Choose generation mode and supported controls.
4. Separate visual anchors from motion instruction.
5. Write one positive action sequence and one concise preservation clause.
6. Specify output settings.
7. Run a low-cost test.
8. Adjust a single cause of failure and version the prompt.

## Output contract

**Deliverable:** Compiled prompt package

**Required fields or sections:**
- model/mode.
- reference IDs.
- positive prompt.
- preservation constraints.
- duration.
- aspect.
- camera control.
- first/last frame IDs if used.
- expected end state.
- validation frames.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. Subject drift: strengthen reference or simplify motion.
2. Impossible multi-action prompt: split shot.
3. Static output: make the verb and camera motion explicit.
4. Warped text: use exact pack asset or composite in post.
5. Unsupported control: remove it and choose a supported mode.

## Evaluation rubric

Score 0–2 each: shot fidelity, control validity, identity protection, testability. Pass at 7/8; invented model capability fails. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## Prompt compilation contract

A prompt package has five separable components: **visual anchors**, **subject action**, **camera action**, **scene action**, and **preservation constraints**. Avoid blending them into a long prose paragraph full of contradictory adjectives. For I2V, the input frame owns appearance and composition; text should chiefly describe motion and what must stay stable. For T2V, the prompt must establish the visible subject and environment more fully. An endpoint-control mode is eligible only when the provider actually supports it for the chosen model and duration.

| Source shot property | Prompt representation | Validation |
| --- | --- | --- |
| Identity-critical pack or person | Approved reference ID plus short preservation rule | First, middle and final frames match canonical attributes |
| One physical action | Observable verb, direction and end state | Motion follows the intended sequence |
| Camera behavior | Locked, pan, dolly or other supported motion language | Background parallax and framing behave accordingly |
| Narrative purpose | Desired visual evidence, not abstract emotion alone | A reviewer can infer the shot's job |

## Versioned iteration

Store the shot card, compiled prompt, provider mode/version, references, settings and output asset together. Change one causal dimension per retry: action complexity, reference strength, camera motion or shot duration. Do not respond to a geometry error by adding more mood adjectives. If exact text or logo cannot be preserved, route to compositing or a practical insert. The compiler must never present a prompt as a generated shot. Mark unsupported controls, ambiguous action state and missing reference transport before any paid call.

## Semantic preservation across model instructions

Compile a shot contract into model-specific inputs without losing the creative purpose. Separate invariants such as product geometry and character identity from variables such as camera movement or background motion. Express one dominant action, camera behavior, duration and end state in concrete language; use reference assets for identity rather than hoping text recreates exact packaging. Confirm which controls the selected model actually supports.

Trace each prompt field back to the shot plan. If a requirement cannot be represented by the available mode, report the gap and choose another mode or shot design. Keep a versioned prompt with reference IDs, parameters and observed output defects. Revisions should alter the causal variable that failed, not add a longer list of conflicting adjectives.
