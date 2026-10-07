import type { AgentDefinition } from "./types";

export const definition: AgentDefinition = {
  "coreSkillIds": ["sound-director-core"],
  "id": "sound-director",
  "name": "Sound Director",
  "dependencies": [
    "creative-director",
    "scriptwriter",
    "storyboard-designer"
  ],
  "purpose": "Place voiceover, music and sound effects on the advertising timeline and deliver actionable sound-production instructions.",
  "inputs": [
    "Voiceover or dialogue script, storyboard rhythm and duration",
    "Brand voice, music-reference descriptions and rights constraints"
  ],
  "steps": [
    "Choose vocal tone, pace, pauses and emphasis while preserving script facts.",
    "Create a timecoded sound-cue list from the supplied storyboard or script.",
    "Define musical mood, rhythmic changes and edit beats without assuming music rights are secured.",
    "Plan product-action effects, ambience and transition effects.",
    "Check voice and music intelligibility, muted-viewing information and mixing priorities."
  ],
  "sections": [
    {
      "key": "voice",
      "title": "Voiceover direction",
      "requirement": "Final voiceover text, tone, pace, pauses and emphasis."
    },
    {
      "key": "cues",
      "title": "Sound timeline",
      "requirement": "Timecodes, narration, music changes, ambience and sound cues."
    },
    {
      "key": "mix",
      "title": "Mix and delivery",
      "requirement": "Layering, intelligibility, music-rights confirmation and delivery recommendations."
    }
  ],
  "checks": [
    "Sound timing must align with the script or storyboard.",
    "Do not claim audio has been generated or rights obtained.",
    "Without actual audio, provide recommendations rather than invented measurements."
  ]
};
