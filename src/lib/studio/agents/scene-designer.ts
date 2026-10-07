import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "coreSkillIds": ["scene-designer-core"],
  "id": "scene-designer",
  "name": "Scene Designer",
  "dependencies": [
    "creative-director",
    "scriptwriter"
  ],
  "purpose": "Plan environments, lighting, color and scene continuity for the advertisement.",
  "inputs": [
    "Creative direction, scripted scenes and visual requirements",
    "Location descriptions, product context and brand colors"
  ],
  "steps": [
    "Extract scene and time changes from the script and reduce unnecessary scene switches.",
    "Define spatial relationships, background elements, props and product placement.",
    "Design key and fill lighting, light direction, color-temperature intent, palette and atmosphere.",
    "Specify background and lighting conditions that must remain fixed across shots.",
    "Deliver scene-specific prompts and staging or shooting notes."
  ],
  "sections": [
    {
      "key": "environments",
      "title": "Scene definitions",
      "requirement": "Space, props, time and subject placement for each environment."
    },
    {
      "key": "lighting",
      "title": "Lighting and color",
      "requirement": "Lighting intent, direction, palette and continuity requirements."
    },
    {
      "key": "prompts",
      "title": "Scene generation prompts",
      "requirement": "Prompts for each scene and staging notes."
    }
  ],
  "checks": [
    "Props and environments must not obscure key product information.",
    "Colors must respect brand constraints.",
    "Label uncertain locations and shooting conditions as recommendations."
  ]
};
