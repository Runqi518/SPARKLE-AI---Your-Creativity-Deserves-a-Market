---
name: qc-regeneration
description: Detect shot defects and drive bounded, causal regeneration after inspecting actual media.
---

# QC & Regeneration

- **Layer:** L3
- **Placement:** runtime-spec
- **Implementation:** specification

## Professional model

A real QC loop needs media inspection, defect localization, a fixed rubric, version history and an attempt budget. Inspect identity, motion, physics, artifacts and brand truth directly; benchmark scores cannot approve a specific branded ad. Regeneration should target one causal defect rather than random prompt changes.

## Required inputs and dependencies

- Generated media and source shot.
- Canonical references.
- Expected action.
- Timecoded samples.
- Provider metadata.
- Max attempts and cost.
- Brand rules.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Hard-block logo/claim mutation, impossible required action or missing output.
2. Treat mild aesthetic variance as a weighted issue.
3. Require timecode evidence for a motion defect.
4. Never auto-regenerate without a remaining attempt budget.
5. Keep the best valid version and record all candidates.

## Operating procedure

1. Verify file and playback.
2. Sample across full duration and inspect at normal speed.
3. Score identity, geometry, motion, physics, temporal continuity, audio and story purpose.
4. Localize root cause.
5. Choose prompt/asset/provider/shot-design repair.
6. Render one targeted candidate.
7. Compare on same rubric.
8. Accept or stop with residual defects.

## Output contract

**Deliverable:** QC report

**Required fields or sections:**
- shot_id.
- asset_id.
- observed timecode.
- dimension.
- severity.
- evidence.
- likely cause.
- chosen repair.
- attempts/cost.
- accepted version.
- unresolved risks.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. If visual corruption recurs with the same movement, simplify the shot.
2. If pack changes, re-anchor approved image rather than adding adjectives.
3. If retry cost is exhausted, use static frame plus edit or request pickup.
4. If actual media cannot be accessed, report QC as unperformed.

## Evaluation rubric

Score 0–2 each: defect coverage, causal diagnosis, comparative evidence, budget discipline. Pass at 7/8; uninspected media marked passed fails. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## QC gate and repair selection

QC must inspect the actual output file and compare it to the shot contract, canonical references and adjacent shots. A prompt, thumbnail or provider completion flag is insufficient. Apply hard gates first: missing asset, unreadable or changed brand identity, false product behavior, impossible required action, rights violation. Then score graded dimensions such as aesthetics, pacing, flicker and minor background continuity. The defect record needs timecode, observable evidence, likely cause and proposed repair.

| Defect mechanism | First intervention | Stop or reroute condition |
| --- | --- | --- |
| Action overload | Reduce verbs or divide into shots | Narrative beat cannot survive split |
| Weak reference control | Improve canonical asset or choose a mode with stronger anchoring | Provider still mutates identity |
| Camera-induced drift | Reduce motion or change camera path | Proof becomes unreadable |
| Provider-specific artifact | Try eligible fallback with the same rubric | Cost or time ceiling reached |

## Comparison discipline

Predeclare attempt ceiling and acceptable residual defects. Compare candidate to baseline at identical timecodes and delivery size, not by selecting the best still from each. Preserve accepted aspects when revising one variable. Record total cost per accepted shot, not only cost per render. If the failure is strategic or factual, return to upstream strategy or source assets; generation retries cannot cure a wrong proposition. An unresolved hard defect remains a failed shot even if the latest candidate is the best available.

## Repair triage by causal defect

Audit generated media for brand/product truth, identity, physical plausibility, temporal coherence, action completion, image artifacts, sound and lip sync. Record defect location, severity, affected deliverable and the exact contract clause it violates. Block product or claim misrepresentation regardless of aesthetic quality. Use a fixed rubric across versions so a changed score reflects a real improvement.

Select the smallest repair: trim a bad tail, composite an exact pack, change a motion parameter, regenerate one shot or revise an upstream script. Define maximum attempts and fallback before retrying. Keep the best candidate and record residual defects. If no attempt meets hard gates, return a failed shot with an executable alternative rather than silently selecting the least bad render.
