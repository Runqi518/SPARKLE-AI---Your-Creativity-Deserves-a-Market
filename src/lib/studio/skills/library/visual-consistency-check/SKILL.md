---
name: visual-consistency-check
description: "Audit a specific set of shot descriptions or media against canonical product, person and scene references."
---

# Visual Consistency Check

- **Layer:** L3
- **Placement:** standalone
- **Implementation:** operational

## Specialization mandate

Audit a specific set of shot descriptions or media against canonical product, person and scene references. Compare identity, state and style separately at each cut; record the exact defect and smallest correction. Do not infer visual consistency from text descriptions alone when actual frames exist but have not been inspected. Output a shot-by-shot continuity matrix with pass/revise/unverified.

## Frame-to-frame state audit

Build an anchor sheet from approved product, character, wardrobe and scene references. For each shot compare identity features, material/color, logo and label, lighting direction, object state, action state and framing. Record the exact frame or interval where a defect appears. Distinguish an intentional state change, such as a jacket removed on camera, from an unexplained drift across a cut.

Prioritize product misrepresentation and character identity loss over minor palette variation. Decide whether the smallest repair is a crop, cutaway, compositing pass, targeted regeneration or upstream prompt correction. A text prompt may describe continuity, but it cannot prove rendered frames meet it. When actual media is unavailable, return an unverified plan-level check rather than a visual pass. Include accepted reference IDs in the handoff.

## Professional model

Continuity is a state management problem as much as a visual similarity problem. Maintain canonical identity assets and explicit per-shot state transitions. Judge identity consistency and temporal stability separately; a smooth shot can still show the wrong product or clothing.

## Required inputs and dependencies

- Approved reference pack.
- Asset IDs.
- Product attributes.
- Character and wardrobe sheets.
- Scene bible.
- Shot plan.
- Generated frames and timestamps.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Treat logo, pack silhouette and approved color as hard invariants.
2. Track state that may change (lid open/closed, object in hand, wet/dry, time of day) separately.
3. Compare adjacent shots at cut boundaries.
4. Do not solve a continuity error by silently changing the source of truth.
5. Prioritize narrative-critical objects.

## Operating procedure

1. Create identity and state ledger.
2. Annotate every shot’s entry/exit states.
3. Compare samples against canonical assets and previous shot.
4. Classify mismatch as identity, state, lighting or intentional transition.
5. Repair the smallest shot or source prompt.
6. Re-check dependent shots after a change.

## Output contract

**Deliverable:** Continuity ledger

**Required fields or sections:**
- entity_id.
- invariant attributes.
- state variables.
- reference IDs.
- shot entry/exit.
- defect timecode.
- severity.
- fix owner and verification result.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. No canonical product photo: request one and mark visual output provisional.
2. Drift within a clip: reduce motion or change model.
3. Repeated scene drift: use a locked scene frame.
4. Conflicting continuity: choose an explicit story transition or reshoot one side.

## Evaluation rubric

Score 0–2 each: identity fidelity, state continuity, transition clarity, traceability. Pass at 7/8; altered logo or unexplained product swap fails. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## Identity versus state

An **identity invariant** is a property that should not change across the campaign, such as product silhouette, approved label, face structure or owned brand color. A **state variable** legitimately changes through action, such as lid position, clothing layer, prop location or time of day. A **style parameter** may vary within an approved range. Put these in separate ledger columns; otherwise reviewers may either reject intentional changes or miss identity drift.

| Comparison | Inspect | Decision |
| --- | --- | --- |
| Shot to canonical reference | Exact product/person attributes | Reject unauthorized identity change |
| Adjacent shot boundary | Hand, prop, posture, light and direction | Require visible transition or repair |
| Intra-shot time samples | Morphing, flicker and geometry | Reject temporal mutation even if endpoints match |
| Platform variants | Cue and claim preservation after crop/edit | Rebuild framing if core identity is lost |

## Dependency control

Every shot should declare entry state, action and exit state. The next shot's entry must match or show a motivated change. When a canonical reference changes, identify every derived frame, prompt, video and edit that must be revisited; do not silently redefine the reference to match a flawed generation. Prioritize product, people and causal props over harmless background variations. Report unresolved discrepancies with timecode and severity so the editor can decide whether a cut hides or magnifies them. Continuity approval should cite the exact canonical asset version.

## Identity and state matrix

Maintain canonical references for product, character, wardrobe, set and style with version IDs. For every shot record initial and final state, including hand position, product orientation, prop placement, lighting direction and damage or use marks. Compare adjacent shots by identity and temporal state separately: a person can look identical yet hold the wrong object, and a smooth transition can still alter the product.

Set tolerances by role. Package text, logo and product function may be immutable; ambient background detail may vary. Use actual frame inspection when media exists, and mark plan-only assessments unverified. Localize the defect and choose crop, edit, compositing or targeted regeneration based on severity and cost. Preserve accepted reference frames for later model calls.
