"use client";
import { useEffect, useEffectEvent, useState } from "react";
import { Plus } from "lucide-react";
import { agentResultText, type AgentRun, type AgentSubmission } from "../../../schemas/studio-agent";
import { request } from "./data";

const statusLabels = { queued: "Queued", running: "Working", succeeded: "Complete", needs_input: "Needs your input", failed: "Failed", blocked: "Waiting for input" };

export function AgentRunMessage({ runId, submission, onUpdate, onAdd }: {
  runId?: string;
  submission?: AgentSubmission;
  onUpdate: (run: AgentRun) => void;
  onAdd: (name: string, content: string) => void;
}) {
  const [run, setRun] = useState<AgentRun | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const update = useEffectEvent((next: AgentRun) => onUpdate(next));
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let currentId = runId;
    async function refresh() {
      try {
        const { run: next } = currentId
          ? await request<{ run: AgentRun }>(`/api/studio/assist/${currentId}`, { signal: controller.signal })
          : await request<{ run: AgentRun }>("/api/studio/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(submission), signal: controller.signal });
        if (controller.signal.aborted) return;
        currentId = next.id;
        setRun(next); setError(""); update(next);
        if (["queued", "running"].includes(next.status)) timer = setTimeout(refresh, 1500);
      } catch (cause) {
        if (!controller.signal.aborted) setError((cause as Error).message);
      }
    }
    if (currentId || submission) void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [runId, submission, attempt]);

  return <div className="agent-run" aria-label="Agent tasks">
    {run ? <>
      <div className="agent-run-status" role="status">{statusLabels[run.status]} · {run.tasks.filter(task => task.status === "succeeded").length}/{run.tasks.length} agents</div>
      {run.tasks.map(task => <details className="agent-task" key={task.agentId} open={task.status === "needs_input" || task.status === "failed" || task.status === "running"}>
        <summary><strong>{task.name}</strong><span data-status={task.status}>{statusLabels[task.status]}</span></summary>
        {task.dependencies.length > 0 && <small>Receives from {task.dependencies.map(id => run.tasks.find(other => other.agentId === id)?.name).join(", ")}</small>}
        {task.error && <p className="agent-task-error">{task.error}</p>}
        {task.result && <>
          <p>{task.result.summary}</p>
          {task.result.sections.map(section => <div className="agent-deliverable" key={section.key}><h4>{section.title}</h4><p>{section.content}</p></div>)}
          {task.result.assumptions.length > 0 && <div className="agent-deliverable"><h4>Assumptions</h4><p>{task.result.assumptions.join("\n")}</p></div>}
          {task.result.questions.length > 0 && <div className="agent-deliverable"><h4>Questions</h4><p>{task.result.questions.join("\n")}</p></div>}
          {task.status === "succeeded" && <button className="text-button" onClick={() => onAdd(task.name, agentResultText(task.result!))}>Add to canvas <Plus size={13} /></button>}
        </>}
      </details>)}
    </> : !error && <div className="agent-run-status" role="status">Starting your agents…</div>}
    {error && <div className="agent-task-error" role="alert"><p>{error}</p><button className="text-button" onClick={() => setAttempt(current => current + 1)}>Retry connection</button></div>}
  </div>;
}
