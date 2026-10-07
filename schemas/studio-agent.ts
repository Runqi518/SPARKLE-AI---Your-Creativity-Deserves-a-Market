export type AgentResult = {
  status: "ready" | "needs_input";
  summary: string;
  sections: { key: string; title: string; content: string }[];
  assumptions: string[];
  questions: string[];
};
export type AgentSubmission = {
  requestId: string;
  projectId: string;
  prompt: string;
  agents: string[];
  attachedSkillIds?: string[];
  context: { id?: string; label: string; kind: string; content?: string; caption?: string; url?: string }[];
  history: { role: "user" | "assistant"; content: string; label?: string }[];
};
export type AgentTask = {
  agentId: string;
  name: string;
  dependencies: string[];
  activeSkillIds?: string[];
  status: "queued" | "running" | "succeeded" | "needs_input" | "failed" | "blocked";
  result?: AgentResult;
  error?: string;
  startedAt?: string;
  completedAt?: string;
};
export type AgentRun = {
  id: string;
  requestId: string;
  projectId: string;
  prompt: string;
  attachedSkillIds?: string[];
  status: "queued" | "running" | "succeeded" | "needs_input" | "failed";
  tasks: AgentTask[];
  createdAt: string;
  updatedAt: string;
};

export function agentResultText(result: AgentResult) {
  return [result.summary, ...result.sections.map(section => `${section.title}\n${section.content}`),
    ...(result.assumptions.length ? [`Assumptions\n${result.assumptions.join("\n")}`] : []),
    ...(result.questions.length ? [`Questions\n${result.questions.join("\n")}`] : [])].join("\n\n");
}

export function agentRunText(run: AgentRun) {
  return run.tasks.map(task => `${task.name} (${task.status})\n${task.result ? agentResultText(task.result) : task.error || ""}`).join("\n\n");
}
