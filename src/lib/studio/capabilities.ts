// Shared labels for the UI and backend. Detailed execution instructions stay on the server.
export const agents = [
  {
    id: "creative-director",
    name: "Creative Director",
    role: "Campaign strategy, creative direction and production planning.",
  },
  {
    id: "scriptwriter",
    name: "Scriptwriter",
    role: "Hooks, selling points, timed scripts and voiceover copy.",
  },
  {
    id: "product-visual-designer",
    name: "Product Visual Designer",
    role: "Product imagery, packaging and detail shots.",
  },
  {
    id: "character-designer",
    name: "Character Designer",
    role: "Character references and consistent visual identity.",
  },
  {
    id: "scene-designer",
    name: "Scene Designer",
    role: "Locations, lighting, environments and atmosphere.",
  },
  {
    id: "storyboard-designer",
    name: "Storyboard Designer",
    role: "Shot breakdowns, framing, movement and timing.",
  },
  {
    id: "sound-director",
    name: "Sound Director",
    role: "Voiceover, music direction and sound design.",
  },
  {
    id: "final-editor",
    name: "Final Editor",
    role: "Shot order, captions, timing and final composition.",
  },
] as const;
export type StudioAgentId = (typeof agents)[number]["id"];
export const skills = [
  {
    id: "reference-breakdown",
    name: "Reference breakdown",
    role: "Describe the rhythm and shot structure of a supplied reference.",
  },
  {
    id: "motion-graphics",
    name: "Motion graphics",
    role: "Plan editable text, data and graphic animation.",
  },
  {
    id: "caption-polish",
    name: "Caption polish",
    role: "Refine captions for clarity, length and brand tone.",
  },
  {
    id: "brand-check",
    name: "Brand check",
    role: "Check copy and creative direction against the supplied brand brief.",
  },
  { id: "audience-hook-strategy", name: "Audience & Hook Strategy", role: "Turn audience needs and product benefits into ad angles and opening hooks." },
  { id: "ugc-ad-writer", name: "UGC Ad Writer", role: "Write natural creator-style ad scripts with honest experiences and a clear CTA." },
  { id: "product-demo-planner", name: "Product Demo Planner", role: "Plan product demonstrations that make each feature and benefit visible." },
  { id: "shot-list-builder", name: "Shot List Builder", role: "Break an ad into timed shots, framing, movement, actions and transitions." },
  { id: "visual-consistency-check", name: "Visual Consistency Check", role: "Review supplied shot descriptions for consistent products, characters, scenes and color." },
  { id: "platform-format-adapter", name: "Platform Format Adapter", role: "Adapt framing, pacing, captions and openings to the target placement." },
  { id: "cta-offer-writer", name: "CTA & Offer Writer", role: "Write clear calls to action and offers with complete, supported conditions." },
  { id: "brand-voice-adapter", name: "Brand Voice Adapter", role: "Rewrite copy to match a supplied brand voice and vocabulary." },
  { id: "compliance-claims-review", name: "Compliance & Claims Review", role: "Flag unsupported claims, missing offer conditions and items needing review." },
  { id: "accessibility-pass", name: "Accessibility Pass", role: "Improve caption readability, contrast, pacing and silent-viewing comprehension." },
  { id: "creative-variant-generator", name: "Creative Variant Generator", role: "Develop distinct creative routes with clear angles and visual differences." },
  { id: "ad-performance-review", name: "Ad Performance Review", role: "Interpret supplied campaign metrics and plan the next creative tests." },
] as const;

export type StudioSkillId = (typeof skills)[number]["id"];
