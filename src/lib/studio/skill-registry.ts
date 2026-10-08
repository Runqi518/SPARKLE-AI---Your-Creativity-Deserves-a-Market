import { agents, skills, type StudioAgentId, type StudioSkillId } from "./capabilities";

export type SkillCategory = "strategy" | "creative" | "production" | "evaluation";
export type SkillMetadata = {
  id: StudioSkillId;
  name: string;
  description: string;
  category: SkillCategory;
  trigger: string;
  compatibleAgents: StudioAgentId[];
  inputs: string[];
  outputs: string[];
  dependencies: StudioSkillId[];
  conflicts: StudioSkillId[];
  priority: number;
  featured: boolean;
  execution: "text" | "image" | "video";
};

const allAgents = agents.map(agent => agent.id);
const director: StudioAgentId[] = ["creative-director", "scriptwriter", "product-visual-designer", "storyboard-designer"];
const creative: StudioAgentId[] = ["creative-director", "scriptwriter", "storyboard-designer", "final-editor"];

const curated: Partial<Record<StudioSkillId, Omit<SkillMetadata, "id" | "name" | "description" | "dependencies" | "conflicts" | "featured" | "execution">>> = {
  "consumer-insight": { category: "strategy", trigger: "Audience motivation is uncertain or needs evidence before concepting.", compatibleAgents: ["creative-director", "scriptwriter"], inputs: ["Audience evidence", "Purchase context", "Product truth"], outputs: ["Insight card", "Creative implication", "Validation plan"], priority: 88 },
  "platform-strategy": { category: "strategy", trigger: "A campaign must be designed for named placements.", compatibleAgents: creative, inputs: ["Placements", "Objective", "Current platform specifications"], outputs: ["Placement strategy", "Version matrix", "Spec checks"], priority: 70 },
  "performance-creative": { category: "strategy", trigger: "Response data or a testable performance brief is available.", compatibleAgents: ["creative-director", "scriptwriter", "final-editor"], inputs: ["Baseline creative", "Metric definitions", "Audience"], outputs: ["Creative hypotheses", "Variant plan", "Decision rule"], priority: 72 },
  "creative-concept": { category: "creative", trigger: "A brief needs distinct, brand-attributable campaign territories.", compatibleAgents: director, inputs: ["Approved brief", "Insight", "Product proof"], outputs: ["Territory cards", "Selection matrix"], priority: 82 },
  "prompt-compiler": { category: "production", trigger: "An approved shot plan needs model-ready prompts.", compatibleAgents: ["product-visual-designer", "character-designer", "scene-designer", "storyboard-designer"], inputs: ["Shot card", "Reference assets", "Provider capability"], outputs: ["Prompt package", "Validation frames"], priority: 60 },
  "consistency": { category: "production", trigger: "A multi-shot campaign needs identity and state continuity.", compatibleAgents: ["product-visual-designer", "character-designer", "scene-designer", "storyboard-designer", "final-editor"], inputs: ["Canonical references", "Shot states"], outputs: ["Continuity ledger", "Correction plan"], priority: 65 },
  "creative-quality": { category: "evaluation", trigger: "A concept or cut needs a structured creative judgment.", compatibleAgents: ["creative-director", "scriptwriter", "storyboard-designer", "final-editor"], inputs: ["Brief", "Concept or cut", "Product proof"], outputs: ["Scored review", "Prioritized corrections"], priority: 68 },
  "generation-quality": { category: "evaluation", trigger: "Actual generated media is available for inspection.", compatibleAgents: ["product-visual-designer", "character-designer", "scene-designer", "storyboard-designer", "final-editor"], inputs: ["Generated media", "Shot intent", "Canonical references"], outputs: ["Timecoded QC scorecard", "Repair recommendation"], priority: 66 },
  "image-generation": { category: "production", trigger: "An approved image brief needs actual image candidates.", compatibleAgents: [], inputs: ["Image brief", "Approved references", "Aspect ratio", "Model"], outputs: ["Image candidates on canvas", "Review decision"], priority: 70 },
  "video-generation": { category: "production", trigger: "An approved shot brief needs an actual video candidate.", compatibleAgents: [], inputs: ["Shot brief", "Approved references", "Duration", "Aspect ratio", "Model"], outputs: ["Video candidate on canvas", "Review decision"], priority: 70 },
  "commercial-ad-strategy": { category: "strategy", trigger: "A campaign needs a strategic brief or a defensible creative territory.", compatibleAgents: allAgents, inputs: ["Objective", "Audience tension", "Product truth", "Evidence", "Channel"], outputs: ["Strategy chain", "Territory comparison", "Creative brief", "Learning agenda"], priority: 90 },
  "brand-strategy": { category: "strategy", trigger: "The team needs coherent brand cues, message hierarchy and claim boundaries.", compatibleAgents: allAgents, inputs: ["Brand materials", "Product facts", "Approved claims"], outputs: ["Brand cue inventory", "Message hierarchy", "Claims ledger"], priority: 80 },
  "product-launch": { category: "strategy", trigger: "The campaign introduces a new product, variant or feature.", compatibleAgents: allAgents, inputs: ["Product change", "Audience", "Adoption barrier", "Proof", "Launch plan"], outputs: ["Launch angle", "Reveal sequence", "Channel matrix", "Measurement plan"], priority: 75 },
  "reference-breakdown": { category: "creative", trigger: "A reference ad or its observed frames are supplied for analysis.", compatibleAgents: creative, inputs: ["Visible reference material", "User product", "Objective"], outputs: ["Beat map", "Mechanism", "Original adaptations"], priority: 65 },
  "ugc-ad-writer": { category: "creative", trigger: "A truthful creator-led direct response ad is needed.", compatibleAgents: ["creative-director", "scriptwriter", "final-editor"], inputs: ["Product facts", "Real creator experience", "Placement", "CTA"], outputs: ["Timed script", "Evidence checklist", "Test plan"], priority: 70 },
  "platform-format-adapter": { category: "production", trigger: "A concept must be adapted to named ad placements.", compatibleAgents: creative, inputs: ["Source cut", "Placements", "Objective", "Available assets"], outputs: ["Version matrix", "Edit notes", "Spec checks"], priority: 60 },
  "creative-variant-generator": { category: "evaluation", trigger: "A campaign needs meaningful A/B creative variants.", compatibleAgents: director, inputs: ["Baseline creative", "Objective", "Audience", "Metrics"], outputs: ["Variant cards", "Test matrix", "Decision rules"], priority: 60 },
  "ad-performance-review": { category: "evaluation", trigger: "Actual campaign metrics are supplied for diagnosis.", compatibleAgents: ["creative-director", "scriptwriter", "final-editor"], inputs: ["Metric definitions", "Results", "Baseline", "Creative"], outputs: ["Diagnosis", "Confidence limits", "Ranked tests"], priority: 65 },
};

const legacy: Partial<Record<StudioSkillId, Pick<SkillMetadata, "category" | "trigger" | "compatibleAgents" | "inputs" | "outputs">>> = {
  "motion-graphics": { category: "production", trigger: "The ad needs animated type, graphics or data overlays.", compatibleAgents: ["creative-director", "scene-designer", "storyboard-designer", "final-editor"], inputs: ["Script", "Visual style", "Graphic assets"], outputs: ["Motion plan", "Timing", "Asset list"] },
  "caption-polish": { category: "production", trigger: "On-screen copy needs a clarity and readability pass.", compatibleAgents: ["scriptwriter", "final-editor"], inputs: ["Captions", "Timing", "Brand voice"], outputs: ["Revised captions", "Timing notes"] },
  "brand-check": { category: "evaluation", trigger: "A concept or draft needs checking against a supplied brand brief.", compatibleAgents: ["creative-director", "scriptwriter", "product-visual-designer", "final-editor"], inputs: ["Brand brief", "Draft creative"], outputs: ["Deviations", "Corrections"] },
  "audience-hook-strategy": { category: "strategy", trigger: "The team needs audience-specific angles and openings.", compatibleAgents: ["creative-director", "scriptwriter"], inputs: ["Audience", "Product benefits", "Objective"], outputs: ["Angles", "Hooks", "Test hypotheses"] },
  "product-demo-planner": { category: "creative", trigger: "A product benefit needs a visible, verifiable demonstration.", compatibleAgents: ["scriptwriter", "product-visual-designer", "storyboard-designer"], inputs: ["Features", "Proof", "Shooting limits"], outputs: ["Demo sequence", "Evidence notes"] },
  "shot-list-builder": { category: "production", trigger: "A script needs a timed, executable shot plan.", compatibleAgents: ["creative-director", "scriptwriter", "storyboard-designer"], inputs: ["Script", "Duration", "Assets"], outputs: ["Shot list", "Continuity notes"] },
  "visual-consistency-check": { category: "evaluation", trigger: "Multiple shots need a product, character or scene continuity review.", compatibleAgents: ["product-visual-designer", "character-designer", "scene-designer", "storyboard-designer", "final-editor"], inputs: ["Shot material", "Identity baseline"], outputs: ["Issue list", "Corrections"] },
  "cta-offer-writer": { category: "creative", trigger: "The ad needs a truthful next action or offer ending.", compatibleAgents: ["creative-director", "scriptwriter", "final-editor"], inputs: ["Objective", "Offer terms", "Destination"], outputs: ["CTA options", "Conditions"] },
  "brand-voice-adapter": { category: "creative", trigger: "Draft copy needs to match established brand language.", compatibleAgents: ["creative-director", "scriptwriter"], inputs: ["Brand examples", "Draft copy"], outputs: ["Rewritten copy", "Voice rules"] },
  "compliance-claims-review": { category: "evaluation", trigger: "Claims, testimonials or offers need an evidence review.", compatibleAgents: ["creative-director", "scriptwriter", "product-visual-designer"], inputs: ["Draft claims", "Evidence", "Offer terms"], outputs: ["Claim issues", "Review items"] },
  "accessibility-pass": { category: "evaluation", trigger: "An edit needs readable captions and accessible message delivery.", compatibleAgents: ["scriptwriter", "storyboard-designer", "final-editor"], inputs: ["Script", "Captions", "Edit"], outputs: ["Readability issues", "Corrections"] },
};

export const skillRegistry: SkillMetadata[] = skills.map(skill => {
  const details = curated[skill.id];
  const established = legacy[skill.id];
  return {
    id: skill.id, name: skill.name, description: skill.role,
    category: details?.category || established?.category || "production",
    trigger: details?.trigger || established?.trigger || skill.role,
    compatibleAgents: details?.compatibleAgents || established?.compatibleAgents || allAgents,
    inputs: details?.inputs || established?.inputs || ["User brief", "Relevant project context"],
    outputs: details?.outputs || established?.outputs || ["Editable workflow deliverable"],
    dependencies: [], conflicts: [], priority: details?.priority || 40,
    featured: Boolean(details),
    execution: skill.id === "image-generation" ? "image" : skill.id === "video-generation" ? "video" : "text",
  };
});

export const coreSkillRegistry = [
  { id: "brief-interpretation", name: "Brief Interpretation", agentId: "creative-director", description: "Decision-ready brief, evidence and measurable advertising job." },
  { id: "creative-director-core", name: "Creative Director Core", agentId: "creative-director", description: "Insight, proposition, creative territories and production direction." },
  { id: "scriptwriter-core", name: "Scriptwriter Core", agentId: "scriptwriter", description: "Advertising story, hooks, timed copy, proof and CTA." },
  { id: "product-visual-designer-core", name: "Product Visual Designer Core", agentId: "product-visual-designer", description: "Product truth, hero imagery, material and visual continuity." },
  { id: "character-designer-core", name: "Character Designer Core", agentId: "character-designer", description: "Canonical character identity and wardrobe continuity." },
  { id: "scene-designer-core", name: "Scene Designer Core", agentId: "scene-designer", description: "Location geography, light and prop states." },
  { id: "storyboard-designer-core", name: "Director Core", agentId: "storyboard-designer", description: "Shot purpose, blocking, timing and continuity." },
  { id: "cinematography", name: "Cinematography", agentId: "storyboard-designer", description: "Framing, camera, lens, light and focus decisions." },
  { id: "sound-director-core", name: "Sound Director Core", agentId: "sound-director", description: "Timecoded VO, music, effects and ambience." },
  { id: "final-editor-core", name: "Final Editor Core", agentId: "final-editor", description: "Edit timeline, captions, continuity and delivery." },
] as const;
export type CoreSkillId = (typeof coreSkillRegistry)[number]["id"];

export function skillById(id: string) { return skillRegistry.find(skill => skill.id === id); }
export function coreSkillById(id: string) { return coreSkillRegistry.find(skill => skill.id === id); }
