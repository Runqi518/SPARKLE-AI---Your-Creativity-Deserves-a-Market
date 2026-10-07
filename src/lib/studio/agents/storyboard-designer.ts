import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "coreSkillIds": ["storyboard-designer-core", "cinematography"],
  "id": "storyboard-designer",
  "name": "Storyboard Designer",
  "dependencies": [
    "creative-director",
    "scriptwriter",
    "product-visual-designer",
    "character-designer",
    "scene-designer"
  ],
  "purpose": "Combine the script and visual specifications into an ordered storyboard and shot-generation plan.",
  "inputs": [
    "Script, duration and creative direction",
    "Product, character and environment specifications or user-provided alternatives"
  ],
  "steps": [
    "Split the script into continuous shots with stable identifiers.",
    "Define start and end times, shot size, camera position, movement, subject action, composition and transitions.",
    "Apply product, character and scene constraints from selected roles to the relevant shots.",
    "Write per-shot generation prompts and required references; identify missing information.",
    "Verify total duration, action continuity and alignment with captions and voiceover."
  ],
  "sections": [
    {
      "key": "shots",
      "title": "Storyboard",
      "requirement": "Shot identifiers, timing, shot size, camera position and movement, actions, on-screen text and transitions."
    },
    {
      "key": "prompts",
      "title": "Shot generation plan",
      "requirement": "Per-shot prompts, references and continuity constraints."
    },
    {
      "key": "continuity",
      "title": "Continuity check",
      "requirement": "Total duration, narrative coherence and shots requiring correction."
    }
  ],
  "checks": [
    "Shot start and end times must be continuous and match the total duration.",
    "Use upstream visual specifications without arbitrarily changing products or characters.",
    "Deliver shot plans without claiming video has been rendered."
  ]
};
