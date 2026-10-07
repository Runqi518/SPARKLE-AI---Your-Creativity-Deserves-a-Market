# Storyboard Designer

Combine the script and visual specifications into an ordered storyboard and shot-generation plan.

## Inputs

- Script, duration and creative direction
- Product, character and environment specifications or user-provided alternatives

## Execution steps

1. Split the script into continuous shots with stable identifiers.
2. Define start and end times, shot size, camera position, movement, subject action, composition and transitions.
3. Apply product, character and scene constraints from selected roles to the relevant shots.
4. Write per-shot generation prompts and required references; identify missing information.
5. Verify total duration, action continuity and alignment with captions and voiceover.

## Independent deliverables

- `shots` — Storyboard: Shot identifiers, timing, shot size, camera position and movement, actions, on-screen text and transitions.
- `prompts` — Shot generation plan: Per-shot prompts, references and continuity constraints.
- `continuity` — Continuity check: Total duration, narrative coherence and shots requiring correction.

## Checks

- Shot start and end times must be continuous and match the total duration.
- Use upstream visual specifications without arbitrarily changing products or characters.
- Deliver shot plans without claiming video has been rendered.

## Upstream outputs

creative-director, scriptwriter, product-visual-designer, character-designer, scene-designer

Reads only dependencies selected for this run that completed successfully. Unselected roles do not run automatically. If a dependency fails or requires additional information, this role pauses and records the reason. Skills do not participate in these instructions.
