# Cinematography

- **Layer:** L2
- **Placement:** agent-core
- **Implementation:** operational

## Professional model

Use shot size and perspective to control information: a wide shot establishes use context, a medium shot clarifies action, and a close-up proves the product mechanism. Lens, distance, depth and movement should have a reason. A “cinematic” adjective without camera and lighting choices is not a production instruction.

## Required inputs and dependencies

- Shot purpose.
- Action blocking.
- Aspect ratio.
- Product surfaces and label orientation.
- Location light.
- Reference frames.
- Camera or model capabilities.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Choose camera distance before focal-length language.
2. Protect legibility of claims and product geometry.
3. Use camera movement only when it reveals or emotionally reframes information.
4. Establish light direction and color continuity across coverage.
5. Check how a vertical crop changes eye and product placement.

## Operating procedure

1. Identify attention target for each beat.
2. Select shot scale and viewpoint.
3. Define composition and negative space for text.
4. Choose static or motivated movement.
5. Plan key/fill/background relationship and reflections.
6. Specify depth-of-field priority.
7. Test adjacent shots for axis, eyeline, brightness and scale jumps.

## Output contract

**Deliverable:** Camera card

**Required fields or sections:**
- shot ID.
- purpose.
- size.
- angle.
- camera height/distance.
- lens intent.
- movement path.
- focus target.
- light direction/quality.
- product-label visibility.
- crop-safe area.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. If product text warps in generation, use a locked-off close-up or composited pack asset.
2. If hand action is hard to parse, move camera to the action side.
3. If shallow depth hides proof, deepen focus.
4. If lighting breaks between shots, anchor a consistent key direction.

## Evaluation rubric

Score 0–2 each: attention hierarchy, action clarity, visual continuity, feasibility. Pass at 7/8; unreadable product proof fails. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## Camera choice hierarchy

Begin with the information the viewer must perceive, then choose shot scale, viewpoint, distance, focus and light. A close-up is useful when it reveals a mechanism; it fails if a hand or reflection blocks the evidence. A wide shot is useful for context; it fails when product identity becomes too small. Describe focal length by its perceptual intent and physical constraints rather than assigning a fashionable number. Evaluate how the frame changes after vertical crop and interface overlays.

| Visual problem | Camera response | Check before approval |
| --- | --- | --- |
| Small product action | Stable angle, sufficient depth of field, clear hand separation | Action readable at delivery size |
| Reflective pack | Controlled key and flag placement | Label and silhouette remain true |
| Spatial transition | Establishing angle or motivated camera move | Screen direction and eyeline remain legible |
| Text overlay | Planned negative space without hiding proof | Actual typography fits safe region |

## Lighting and shot continuity

Document key direction, quality, color temperature intent, exposure priority and reflective surfaces. Keep enough continuity across coverage that the product's color and material do not appear to change. Deliberate lighting shifts need a narrative reason and an edit plan. For synthetic generation, translate these choices into observable language and reference images; do not assume exact optical controls exist. Handoff should include a camera card and a continuity comparison of adjacent shots, with particular attention to product label, focus plane, movement direction and light source logic.

## Optical and lighting intent

Specify camera distance, perspective, shot scale, lens intent, depth of field, movement and motivated lighting in relation to the information the viewer needs. A shallow focus hero frame may hide a label or user action; a dramatic angle may distort product geometry. Select a focal and lighting approach that keeps the approved product identifiable while creating the desired emphasis. State whether movement tracks action, reveals information or changes emotional proximity.

Maintain screen direction and key light logic across adjacent shots unless a deliberate transition resets geography. Review exposure and highlight control on reflective packaging, texture retention on dark products and readability of labels after compression. For generation prompts, communicate achievable camera behavior rather than piling incompatible lens and movement adjectives into one shot.
