import type { StudioAgentId } from "../capabilities";

export type AgentDefinition = {
  id: StudioAgentId;
  name: string;
  dependencies: StudioAgentId[];
  purpose: string;
  inputs: string[];
  steps: string[];
  sections: { key: string; title: string; requirement: string }[];
  checks: string[];
};
