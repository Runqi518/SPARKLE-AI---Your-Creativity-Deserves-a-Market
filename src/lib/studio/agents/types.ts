import type { StudioAgentId } from "../capabilities";
import type { CoreSkillId } from "../skill-registry";

export type AgentDefinition = {
  id: StudioAgentId;
  coreSkillIds?: CoreSkillId[];
  name: string;
  dependencies: StudioAgentId[];
  purpose: string;
  inputs: string[];
  steps: string[];
  sections: { key: string; title: string; requirement: string }[];
  checks: string[];
};
