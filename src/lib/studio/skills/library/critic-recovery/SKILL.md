---
name: critic-recovery
description: Diagnose failed outputs, select bounded repairs and stop when evidence or budget is insufficient.
---

# Critic & Recovery

- **Layer:** L0
- **Placement:** runtime
- **Implementation:** partial

## Professional model

Critique against the task contract and supplied evidence before subjective polish. Classify failures as factual, strategic, structural, brand, provider, media artifact or transient infrastructure. Repair the smallest causal input and preserve valid work. Evaluator–optimizer loops require a clear rubric and stopping rule.

## Required inputs and dependencies

- Artifact and its input versions.
- Acceptance rubric.
- Provider logs.
- Cost/time budget.
- Visible media.
- User priorities.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Block unsupported claims and product misrepresentation regardless of aesthetic score.
2. Do not retry identical inputs after deterministic validation failure.
3. Use a different provider only if the required capability and asset rights are met.
4. Allow at most a configured number of attempts per shot.
5. Terminate when quality gain is below cost threshold.

## Operating procedure

1. Run contract validation.
2. Identify the earliest causal failure.
3. Assign severity and evidence.
4. Choose prompt repair, upstream brief correction, asset replacement, provider fallback or human review.
5. Generate one targeted candidate.
6. Compare against the same rubric and retain the better version.
7. Log attempt count, cost and reason to stop.

## Output contract

**Deliverable:** Issue record

**Required fields or sections:**
- artifact_id.
- defect_type.
- severity.
- evidence_frame_or_text.
- causal_input.
- repair_action.
- attempt_count.
- expected_gain.
- decision. Include accepted and rejected version IDs.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. If a hand is distorted, vary motion complexity or crop rather than changing the brand strategy.
2. If a claim is wrong, correct the source fact and all dependent copy.
3. If repeated renders fail, preserve the best version and report the unresolved defect.

## Evaluation rubric

Score 0–2 each: accurate diagnosis, minimal repair, evidence of improvement, budget/stop discipline. Pass at 7/8; undisclosed residual hard defect fails. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## Defect taxonomy and repair routing

| Defect class | Observable evidence | First repair | Escalate when |
| --- | --- | --- | --- |
| Strategy | Viewer cannot infer why this product matters | Revisit proposition and proof order | Multiple executions fail the same comprehension test |
| Factual or brand | Package or offer differs from approved source | Correct source link or replace exact asset | Source documents conflict or claim approval is unclear |
| Structural | Shot plan exceeds duration or lacks causal beat | Re-cut timeline or split action | Required proof cannot fit the format |
| Generation | Subject geometry or motion violates the shot contract | Simplify motion, lock reference, render one targeted attempt | Same artifact recurs or budget is exhausted |
| Infrastructure | Provider timeout with unknown job state | Query persisted job by request ID | Completion state cannot be established |

A critic should cite the exact line, frame or metric that supports a defect. “Feels weak” is a prompt for diagnosis, not a repair instruction. Rank defects by harm to truth and comprehension before polish. Set a stopping condition before the first retry: maximum attempts, incremental cost, acceptable residual defect and fallback shot construction. A variant that scores higher aesthetically but loses product fidelity is not an improvement.

## Comparative acceptance

Keep a baseline and candidate with the same source brief and rubric. For a motion repair, compare the exact failure interval and adjacent frames, not just the best still. For a copy repair, compare promise clarity and factual scope, not length alone. Report unresolved defects in the handoff so the editor does not mistake “best available” for “approved.” When the user supplies a correction, reopen the causal upstream decision and dependent artifacts; do not simply append a caveat to a wrong result.

## Severity and stopping policy

Use a severity ladder: **blocker** for truth, rights, identity or unusable asset failures; **major** for broken comprehension, causal continuity or required proof; **minor** for local craft defects that do not change meaning. Repair blockers before scoring aesthetic alternatives. For every attempted repair, record the expected change and the observation that would prove improvement. If the same cause persists after the configured attempts, change the production method or escalate to a human decision. Never suppress a blocker by averaging it with strong scores in other dimensions.

## Diagnostic evidence and selective repair

Before proposing a retry, point to the exact line, frame interval, metric or missing asset that fails the contract. State whether the cause lies upstream in the brief, in the creative plan, in a prompt/control, in the provider or in the final assembly. Repair the earliest cause that explains the defect; changing the final prompt cannot correct a false product claim in the brief. Preserve the best prior version and compare candidates against the same source and rubric.

Treat mandatory truth and brand gates separately from scored craft dimensions. A more attractive result with an invented label is worse, even if its aesthetic score rises. Escalate repeated deterministic failures rather than consuming attempts on the same inputs. The recovery record must name the accepted version, unresolved defect, remaining budget and reason for stopping.
