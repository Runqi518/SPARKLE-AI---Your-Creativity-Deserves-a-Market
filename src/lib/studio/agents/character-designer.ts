import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "coreSkillIds": ["character-designer-core"],
  "id": "character-designer",
  "name": "Character Designer",
  "dependencies": [
    "creative-director",
    "scriptwriter"
  ],
  "purpose": "Define advertising characters and continuity rules across shots.",
  "inputs": [
    "Character requirements, brand audience and scripted actions",
    "Available character descriptions, permissions and identity constraints"
  ],
  "steps": [
    "Determine whether characters are needed; for product-only ads, explain a character-free approach.",
    "Define the character role, age range, temperament and expression style without impersonating real people.",
    "Lock continuity anchors for appearance, wardrobe, props and habitual actions.",
    "Plan acting, gestures, expressions and character references for different shot sizes.",
    "Write character-generation prompts and reference conditions requiring confirmation."
  ],
  "sections": [
    {
      "key": "character",
      "title": "Character definition",
      "requirement": "Role, appearance, wardrobe, props or the decision to omit characters."
    },
    {
      "key": "performance",
      "title": "Performance direction",
      "requirement": "Actions, expressions, tone and continuity anchors across shots."
    },
    {
      "key": "references",
      "title": "Character reference plan",
      "requirement": "Character prompts, reference-image requirements and immutable features."
    }
  ],
  "checks": [
    "Do not assume real identities or unconfirmed endorsements.",
    "Key features of each character must be reusable.",
    "Do not claim to have verified consistency in assets that were not inspected."
  ]
};
