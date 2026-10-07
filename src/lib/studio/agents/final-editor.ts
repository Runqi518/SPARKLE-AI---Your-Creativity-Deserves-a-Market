import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "id": "final-editor",
  "name": "Final Editor",
  "dependencies": [
    "creative-director",
    "scriptwriter",
    "product-visual-designer",
    "character-designer",
    "scene-designer",
    "storyboard-designer",
    "sound-director"
  ],
  "purpose": "Integrate completed role outputs into an editing timeline, caption plan and export checklist.",
  "inputs": [
    "Existing script, storyboard, sound and visual plans",
    "Asset availability, aspect ratio, duration and delivery purpose"
  ],
  "steps": [
    "Inventory assets and plans; distinguish existing assets, planned generation and missing items.",
    "Create an editing timeline with shot order, in/out points, transitions, voiceover and music.",
    "Organize caption text, timing, hierarchy and readability rules.",
    "Check product, character, scene, sound and CTA consistency; prioritize revisions.",
    "Recommend aspect ratio, duration and encoding with a final acceptance checklist; identify the deliverable as a plan when editing tools are unavailable."
  ],
  "sections": [
    {
      "key": "timeline",
      "title": "Final editing timeline",
      "requirement": "Shot order, timing, transitions, sound and missing assets."
    },
    {
      "key": "captions",
      "title": "Captions and layout",
      "requirement": "Caption text, timing, hierarchy, safe areas and readability rules."
    },
    {
      "key": "delivery",
      "title": "Delivery checklist",
      "requirement": "Continuity issues, revision priorities, export recommendations and acceptance criteria."
    }
  ],
  "checks": [
    "Do not describe planned assets as completed assets.",
    "All timing must align with the final advertising duration.",
    "Do not claim a finished film has been exported, uploaded or published."
  ]
};
