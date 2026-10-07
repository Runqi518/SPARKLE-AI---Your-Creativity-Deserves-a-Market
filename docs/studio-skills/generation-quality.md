# Generation Quality

- **Layer:** L4
- **Placement:** standalone
- **Implementation:** operational

## Professional model

Synthetic media quality is multidimensional. Inspect subject consistency, smoothness, flicker, spatial relations, physical plausibility and cinematic language as separate dimensions. Use these as inspection dimensions, not as an automatic pass certificate for a specific commercial.

## Required inputs and dependencies

- Actual image/video/audio asset.
- Intended shot.
- Canonical references.
- Timecode access.
- Delivery specs.
- Approved brand/claim rules.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Require direct inspection of full output.
2. Evaluate technical usability separately from artistic fit.
3. Treat product/logo/claim changes as hard failures.
4. Inspect motion and physics at the exact action.
5. Compare first/last states to neighboring shots.
6. Identify defect severity and repair cause.

## Operating procedure

1. Confirm file integrity.
2. Sample start, midpoint, end and high-motion intervals.
3. Watch full-speed playback with and without audio.
4. Score image geometry, subject identity, motion, physics, spatial/temporal continuity and lip-sync when relevant.
5. Compare to shot purpose.
6. Record timecoded defects and a repair recommendation.

## Output contract

**Deliverable:** QC scorecard

**Required fields or sections:**
- asset_id.
- inspected duration.
- sample timecodes.
- dimension scores.
- hard defects.
- observed evidence.
- acceptance decision.
- targeted repair and reviewer confidence.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. Only thumbnail available: return unverified.
2. Physically impossible hero action: reject even if visual score is high.
3. Model benchmark high but local artifact poor: trust local evidence.
4. Repeated defect: switch shot construction rather than endless rerender.

## Evaluation rubric

Score 0–2 each: identity/brand, motion/physics, temporal coherence, delivery fitness. Pass at 7/8; any critical product mutation fails. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## Media-level dimension taxonomy

Separate **identity fidelity**, **spatial geometry**, **temporal coherence**, **physical plausibility**, **cinematic intention** and **delivery fitness**. Aggregate benchmark scores can suggest what to inspect, but local acceptance must use the actual branded asset and shot purpose. A clip may score well on smoothness while changing the package; it may preserve the package while failing the action. Audio and lip sync are evaluated only when the artifact actually contains them.

| Dimension | Inspection method | Hard failure boundary |
| --- | --- | --- |
| Identity | Compare sampled frames to canonical pack/person assets | Product, logo or character changes materially |
| Motion/physics | Review action onset, contact, trajectory and result | Required action becomes impossible or misleading |
| Time | Review start, middle, end and cut boundaries | State jumps without a motivated transition |
| Delivery | Verify file, ratio, resolution, audio and caption compatibility | Asset cannot be used in intended placement |

## Evidence and escalation

Record every defect with timecode, frame reference, severity and whether it is local or recurrent. A score should distinguish uninspected from passed; absence of evidence is not a zero-defect result. Compare repeated generations under the same rubric and note the cost of reaching an accepted shot. If a defect is inherent to the requested motion or provider mode, recommend a different shot construction rather than further prompt ornamentation. Keep creative quality and generation quality as separate reviews so technical polish does not conceal a weak advertising idea.

## Media inspection dimensions

Review the actual rendered asset frame by frame where defects occur and at normal speed for overall action. Score identity, product fidelity, temporal smoothness, physics, camera behavior, composition, text, audio and speech sync separately. A still-frame inspection misses motion errors; a smooth clip may still have impossible product operation. Compare with approved anchors and the shot contract, not a generic aesthetic benchmark.

Flag hard defects that would mislead viewers or break the edit. Localize start/end time, affected object and severity so repair can target the cause. Distinguish defects visible in the asset from risks inferred from a prompt. A passing technical score does not approve brand claims or creative effectiveness; route those to their corresponding evaluators.
