import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "id": "scriptwriter",
  "coreSkillIds": ["scriptwriter-core"],
  "name": "Scriptwriter",
  "dependencies": [
    "creative-director"
  ],
  "purpose": "Turn the creative direction into an advertising script suitable for shooting and voiceover within the intended duration.",
  "inputs": [
    "User brief, product facts and creative direction",
    "Advertising duration, tone and offer conditions"
  ],
  "steps": [
    "Read the creative direction and source facts; define the opening, conflict, product value and ending.",
    "Create multiple opening candidates and select one appropriate for the audience.",
    "Write visual intent, narration or dialogue, on-screen text and product presentation for each time segment.",
    "Estimate read-aloud duration; state assumptions when duration is unspecified.",
    "Check evidence for claims, brand voice and CTA conditions; provide alternative copy."
  ],
  "sections": [
    {
      "key": "hooks",
      "title": "Opening candidates",
      "requirement": "Multiple openings and the rationale for selection."
    },
    {
      "key": "script",
      "title": "Timed script",
      "requirement": "Timing, visual intent, dialogue or voiceover and on-screen text."
    },
    {
      "key": "copy",
      "title": "Copy delivery",
      "requirement": "Complete voiceover, CTA, alternate copy and duration check."
    }
  ],
  "checks": [
    "Segments must be continuous and match the stated total duration.",
    "Do not fabricate user experiences, outcomes or offers.",
    "Visual intent does not replace detailed camera design by the storyboard role."
  ]
};
