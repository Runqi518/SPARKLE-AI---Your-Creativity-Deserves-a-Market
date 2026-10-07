"use client";

/* eslint-disable @next/next/no-img-element -- Canvas media preserves original user-uploaded URLs. */

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  MarkerType,
  useReactFlow,
  type Connection,
  type Edge,
} from "@xyflow/react";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  Expand,
  FileText,
  Layers,
  MessageSquare,
  Minus,
  PanelRightClose,
  Pause,
  Play,
  Plus,
  Redo2,
  Scan,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import "@xyflow/react/dist/style.css";
import { initializeWorkspace, bootstrapLibrary } from "./persistence";
import { StudioShell } from "./StudioShell";
import { Dialog } from "./Dialog";
import { AgentRunMessage } from "./AgentRunMessage";
import { agentRunText, type AgentRun, type AgentSubmission } from "../../../schemas/studio-agent";
import { GenerationNode, NodeActions, kindIcons as typeIcons, defaultGenerationOptions } from "./GenerationNode";
import type { GenerationCandidate, ProviderSummary, StudioJob } from "../../../schemas/studio-generation";
import {
  agents,
  skills,
  exampleNodes,
  exampleEdges,
  request,
  readLocal,
  storeLocal,
  type AssetKind,
  type LibraryAsset,
  type StudioNode,
  type StudioData,
  type Template,
} from "./data";

const nodeTypes = { asset: GenerationNode };
type Snapshot = { nodes: StudioNode[]; edges: Edge[] };
type Message = { role: "user" | "assistant"; content: string; label?: string; runId?: string; requestId?: string; agentInput?: AgentSubmission };

function subscribeScreen(listener: () => void) {
  const query = window.matchMedia("(max-width: 760px)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function CanvasEditor({ id }: { id: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<StudioNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [jobs, setJobs] = useState<Record<string, StudioJob>>({});
  const [submitting, setSubmitting] = useState<string[]>([]);
  const submittingRef = useRef(new Set<string>());
  const generationAttempts = useRef<Record<string, { payload: string; requestId: string }>>({});
  const revision = useRef(0);
  const chatRevision = useRef(0);
  const chatQueue = useRef(Promise.resolve());
  const skillAttempt = useRef<{ key: string; body: string } | null>(null);
  const [chatReady, setChatReady] = useState(false);
  const [panelWidth, setPanelWidth] = useState(326);
  const panelDrag = useRef<{ x: number; width: number } | null>(null);
  const editorLayout = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("Untitled project");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState("Loading");
  const [notice, setNotice] = useState("");
  const smallScreen = useSyncExternalStore(
    subscribeScreen,
    () => window.matchMedia("(max-width: 760px)").matches,
    () => false,
  );
  const [chatOverride, setChatOpen] = useState<boolean | null>(null);
  const chatOpen = chatOverride ?? !smallScreen;
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [referencedIds, setReferencedIds] = useState<string[]>([]);
  const [panel, setPanel] = useState<"agents" | "skills" | null>(null);
  const [team, setTeam] = useState<string[]>([agents[0].name]);
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [executionMode, setExecutionMode] = useState<"agents" | "skills">("agents");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [publish, setPublish] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rendering, setRendering] = useState(false);
  const exportAttempt = useRef<string | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [preview, setPreview] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<{
    past: Snapshot[];
    future: Snapshot[];
  }>({ past: [], future: [] });
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string | null>(null);
  const replaceUpload = useRef(false);
  const lastSaved = useRef("");
  const latestSnapshot = useRef("");
  const saveQueue = useRef(Promise.resolve());
  const dirty = useRef(false);
  const messageEnd = useRef<HTMLDivElement>(null);
  const flow = useReactFlow<StudioNode>();
  const referencedNodes = referencedIds.flatMap(nodeId => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? [node] : [];
  });
  const editNode = nodes.find((n) => n.id === editing);
  const totalDuration = Math.max(
    15,
    ...nodes.map(
      (n) => Number(n.data.start || 0) + Number(n.data.duration || 5),
    ),
  );

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await initializeWorkspace();
        await bootstrapLibrary("assets");
        skillAttempt.current = readLocal<{ key: string; body: string } | null>(`sparkle:skill-attempt:${id}`, null);
        generationAttempts.current = readLocal(`sparkle:generation-attempts:${id}`, {});
        let result: { project: { name: string; revision: number; canvas: Snapshot } };
        if (id === "demo") {
          const saved = await request<{ project: { name: string; revision: number; canvas: Snapshot } | null }>("/api/workspace/demo");
          result = saved.project ? { project: saved.project } : await request("/api/workspace/demo", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: readLocal("sparkle:demo-name", "FORM · A daily ritual"), revision: 0, canvas: readLocal("sparkle:demo-canvas", { nodes: exampleNodes(), edges: exampleEdges() }) }) });
        } else result = await request(`/api/projects/${id}`);
        if (!active) return;
        const recovery = readLocal<{
          pending: boolean;
          snapshot: Snapshot;
          revision?: number;
        } | null>(`sparkle:recovery:${id}`, null);
        const canvas = recovery?.pending
          ? recovery.snapshot
          : result.project.canvas;
        const normalized = canvas.nodes.map((n) => ({
          ...n,
          type: "asset",
          dragHandle: ".node-drag",
          data: {
            ...n.data,
            label: n.data.label || "Untitled",
            kind: (n.data.kind ||
              n.data.nodeKind ||
              n.data.type ||
              "text") as AssetKind,
            url:
              n.data.url ||
              (n.data.type !== "text"
                ? (n.data.resultUrl as string)
                : undefined),
            content:
              n.data.content ||
              (n.data.type === "text"
                ? (n.data.resultUrl as string)
                : undefined),
          },
        }));
        setNodes(normalized);
        setSelected(normalized[0]?.id ?? null);
        setEdges(canvas.edges || []);
        setName(result.project.name);
        revision.current = recovery?.pending && recovery.revision !== undefined ? recovery.revision : "revision" in result.project ? result.project.revision : 0;
        setReady(true);
        lastSaved.current = recovery?.pending
          ? ""
          : JSON.stringify({
              nodes: normalized.map(({ id, type, position, data }) => ({
                id,
                type,
                position,
                data,
              })),
              edges: canvas.edges || [],
            });
        if (recovery?.pending)
          setNotice(
            "Recovered your latest edits. Saving them to this project.",
          );
        setSaveStatus(
          "All changes saved",
        );
        const cachedChat = readLocal<{
          team: string[];
          skills: string[];
          messages: Message[];
          references?: string[];
          executionMode?: "agents" | "skills";
        } | null>(`sparkle:chat:${id}`, null);
        const serverChat = await request<{ state: typeof cachedChat; revision: number }>(`/api/projects/${id}/chat`);
        chatRevision.current = serverChat.revision;
        const savedChat = serverChat.state ?? cachedChat;
        setChatReady(true);
        if (savedChat) {
          setTeam([...new Set(savedChat.team)].filter(name => agents.some(agent => agent.name === name)));
          setActiveSkills([...new Set(savedChat.skills)].filter(name => skills.some(skill => skill.name === name)));
          setMessages(savedChat.messages);
          setExecutionMode(savedChat.executionMode === "skills" && savedChat.skills.length ? "skills" : "agents");
          setReferencedIds((savedChat.references || []).filter(nodeId => normalized.some(node => node.id === nodeId)).slice(0, 16));
        }
        if (skillAttempt.current) {
          const attempt = JSON.parse(skillAttempt.current.body) as { requestId: string; prompt: string; skills: string[] };
          const { runs } = await request<{ runs: { requestId: string; status: string; content?: string; error?: string }[] }>(`/api/studio/skills/run?projectId=${encodeURIComponent(id)}`);
          const previous = runs.find(run => run.requestId === attempt.requestId);
          if (previous && ["succeeded", "failed"].includes(previous.status)) {
            if (!savedChat?.messages.some(message => message.requestId === attempt.requestId)) setMessages(current => [...current, { role: "assistant", requestId: attempt.requestId, label: previous.status === "succeeded" ? attempt.skills.join(" + ") : "Connection notice", content: previous.content || previous.error || "Skill execution failed." }]);
            skillAttempt.current = null; storeLocal(`sparkle:skill-attempt:${id}`, null);
          } else { setPrompt(attempt.prompt); setNotice("A saved skill request is unresolved. Retry the same prompt to check its result safely."); }
        }
        try {
          const { runs } = await request<{ runs: AgentRun[] }>(`/api/studio/assist?projectId=${encodeURIComponent(id)}`);
          if (!active) return;
          const previous = savedChat?.messages || [];
          const restored = runs.slice().reverse().flatMap(run => previous.some(message => message.runId === run.id || message.requestId === run.requestId) ? [] : [
            { role: "user" as const, content: run.prompt },
            { role: "assistant" as const, content: agentRunText(run).slice(0, 20000), label: "Agents", runId: run.id, requestId: run.requestId },
          ]);
          if (restored.length) setMessages(current => [...current, ...restored]);
        } catch { /* Existing chat remains available; individual runs can refresh independently. */ }
        const storedWidth = readLocal<number>("sparkle:panel-width", 326);
        if (Number.isFinite(storedWidth)) setPanelWidth(Math.max(280, Math.min(650, storedWidth)));
        const recovered = await request<{ jobs: StudioJob[] }>(`/api/studio/generations?projectId=${encodeURIComponent(id)}`).catch(() => ({ jobs: [] as StudioJob[] }));
        if (!active) return;
        for (const [nodeId, attempt] of Object.entries(generationAttempts.current)) {
          const result = await request<{ job: StudioJob | null }>(`/api/studio/generations?projectId=${encodeURIComponent(id)}&requestId=${attempt.requestId}`).catch(() => ({ job: null }));
          if (result.job) { recovered.jobs.unshift(result.job); delete generationAttempts.current[nodeId]; }
        }
        storeLocal(`sparkle:generation-attempts:${id}`, generationAttempts.current);
        const latest: Record<string, StudioJob> = {};
        for (const job of recovered.jobs) if (!latest[job.nodeId] && normalized.some(n => n.id === job.nodeId && (!n.data.jobId || n.data.jobId === job.id))) latest[job.nodeId] = job;
        setJobs(latest);
        setNodes(current => current.map(node => {
          const job = latest[node.id];
          if (!job || (node.data.jobId && node.data.jobId !== job.id)) return node;
          return { ...node, data: { ...node.data, jobId: job.id, generationStatus: job.status, generationError: job.error,
            candidates: [...(node.data.candidates || []).filter(candidate => !job.candidates.some(next => next.id === candidate.id)), ...job.candidates].slice(-12) } };
        }));
      } catch (e) {
        if (active) setLoadError((e as Error).message);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id, setNodes, setEdges]);

  useEffect(() => {
    const controller = new AbortController();
    request<{ providers: ProviderSummary[] }>("/api/studio/providers", { signal: controller.signal }).then(result => setProviders(result.providers)).catch(() => {});
    return () => controller.abort();
  }, []);

  const pendingJobs = nodes.filter(node => node.data.jobId && (!jobs[node.id] || ["queued", "running"].includes(jobs[node.id].status))).map(node => node.data.jobId!).sort().join(",");
  useEffect(() => {
    if (!pendingJobs) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      await Promise.all(pendingJobs.split(",").map(async jobId => {
        try {
          const { job } = await request<{ job: StudioJob }>(`/api/studio/generations/${jobId}`, { signal: controller.signal });
          if (controller.signal.aborted) return;
          setJobs(current => ({ ...current, [job.nodeId]: job }));
          setNodes(current => current.map(node => node.id !== job.nodeId || node.data.jobId !== job.id ? node : {
            ...node, data: { ...node.data, generationStatus: job.status, generationError: job.error,
              candidates: [...(node.data.candidates || []).filter(candidate => !job.candidates.some(next => next.id === candidate.id)), ...job.candidates].slice(-12) },
          }));
        } catch (error) {
          if (!controller.signal.aborted) setNotice(`Could not refresh generation status: ${(error as Error).message}`);
        }
      }));
      if (!controller.signal.aborted) timer = setTimeout(poll, 2500);
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [pendingJobs, setNodes]);

  useEffect(() => {
    if (!ready) return;
    // Runtime selection and measured sizes do not belong in the persisted project.
    const snapshot = {
      nodes: nodes.map(({ id: nodeId, type, position, data }) => ({
        id: nodeId,
        type,
        position,
        data,
      })),
      edges,
    };
    const serialized = JSON.stringify(id === "demo" ? { ...snapshot, name } : snapshot);
    latestSnapshot.current = serialized;
    if (serialized === lastSaved.current) return;
    dirty.current = true;
    // Keep an immediate recovery copy so navigation during the debounce cannot lose edits.
    try {
      storeLocal(`sparkle:recovery:${id}`, { pending: true, snapshot, revision: revision.current });
    } catch {
      /* The server save remains available when browser storage is full. */
    }
    const timer = setTimeout(() => {
      setSaveStatus("Saving...");
      saveQueue.current = saveQueue.current
        .catch(() => {})
        .then(async () => {
          try {
            if (id === "demo") {
              const saved = await request<{ project: { revision: number } }>("/api/workspace/demo", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, canvas: snapshot, revision: revision.current }) });
              revision.current = saved.project.revision; storeLocal("sparkle:demo-canvas", snapshot);
            }
            else {
              const saved = await request<{ project: { revision: number } }>(`/api/projects/${id}/canvas`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...snapshot, revision: revision.current }),
              });
              revision.current = saved.project.revision;
            }
            lastSaved.current = serialized;
            if (latestSnapshot.current === serialized) {
              dirty.current = false;
              try {
                storeLocal(`sparkle:recovery:${id}`, {
                  pending: false,
                  snapshot,
                  revision: revision.current,
                });
              } catch {
                /* Saved on the server already. */
              }
              setSaveStatus(
                "All changes saved",
              );
            }
          } catch (e) {
            setSaveStatus("Save failed");
            setNotice((e as Error).message);
          }
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [nodes, edges, id, ready, name]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  useEffect(() => {
    if (ready && chatReady) {
      const state = { team, skills: activeSkills, executionMode, messages, references: referencedIds.filter(nodeId => nodes.some(node => node.id === nodeId)) };
      const timer = setTimeout(() => {
        chatQueue.current = chatQueue.current.catch(() => {}).then(async () => {
          try {
            const saved = await request<{ revision: number }>(`/api/projects/${id}/chat`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state, revision: chatRevision.current }) });
            chatRevision.current = saved.revision;
          } catch (error) { setNotice((error as Error).message); }
        });
      }, 500);
      try {
        storeLocal(`sparkle:chat:${id}`, {
          team,
          skills: activeSkills,
          executionMode,
          messages,
          references: referencedIds.filter(nodeId => nodes.some(node => node.id === nodeId)),
        });
      } catch {
        /* The canvas save status remains independent of chat storage. */
      }
      return () => clearTimeout(timer);
    }
  }, [ready, chatReady, team, activeSkills, executionMode, messages, referencedIds, nodes, id]);
  useEffect(() => {
    if (!messages.length && !busy) return;
    messageEnd.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, busy]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setPlayhead((value) => {
          if (value >= totalDuration) {
            setPlaying(false);
            return 0;
          }
          return Math.min(totalDuration, value + 0.1);
        }),
      100,
    );
    return () => clearInterval(timer);
  }, [playing, totalDuration]);

  function remember() {
    setSaveStatus("Unsaved changes");
    setHistory((h) => ({
      past: [...h.past.slice(-39), structuredClone({ nodes, edges })],
      future: [],
    }));
  }
  function undo() {
    const prev = history.past.at(-1);
    if (!prev) return;
    setHistory({
      past: history.past.slice(0, -1),
      future: [{ nodes, edges }, ...history.future],
    });
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }
  function redo() {
    const next = history.future[0];
    if (!next) return;
    setHistory({
      past: [...history.past, { nodes, edges }],
      future: history.future.slice(1),
    });
    setNodes(next.nodes);
    setEdges(next.edges);
  }
  const onKeyboard = useEffectEvent((event: KeyboardEvent) => {
    if (
      (event.target as HTMLElement).closest(
        "input, textarea, select, [contenteditable], dialog",
      )
    )
      return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyboard(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  function update(idToUpdate: string, data: Partial<StudioData>) {
    remember();
    configure(idToUpdate, data);
  }
  function configure(idToUpdate: string, data: Partial<StudioData>) {
    setNodes((current) =>
      current.map((n) =>
        n.id === idToUpdate ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    );
  }
  function add(kind: AssetKind, data: Partial<StudioData> = {}, referenceTarget?: string) {
    remember();
    const center = flow.screenToFlowPosition({
      x: window.innerWidth * 0.45,
      y: window.innerHeight * 0.35,
    });
    const node: StudioNode = {
      id: crypto.randomUUID(),
      type: "asset",
      dragHandle: ".node-drag",
      position: { x: center.x - 170, y: center.y - 80 },
      data: {
        label: `Untitled ${kind}`,
        kind,
        start: 0,
        duration: 5,
        track:
          kind === "audio" ? "Music" : kind === "text" ? "Captions" : "Video",
        ...data,
      },
    };
    const linked = nodes.find(n => n.id === referenceTarget);
    if (linked) {
      node.position = { x: linked.position.x - 440, y: linked.position.y + edges.filter(e => e.target === linked.id).length * 360 };
      setEdges(current => addEdge({ id: crypto.randomUUID(), source: node.id, target: linked.id, sourceHandle: "output", targetHandle: "input" }, current));
    }
    setNodes((current) => [...current, node]);
    setSelected(node.id);
    if (linked) void flow.setCenter(node.position.x + 165, node.position.y + 310, { zoom: Math.max(flow.getZoom(), 0.7), duration: 300 });
    return node.id;
  }
  function canConnect(connection: Connection | Edge, replacingId?: string) {
    if (!connection.source || !connection.target || connection.source === connection.target) return false;
    if (!nodes.some(node => node.id === connection.source) || !nodes.some(node => node.id === connection.target)) return false;
    const connections = edges.filter(edge => edge.id !== replacingId);
    if (connections.length >= 1000 || connections.some(edge => edge.source === connection.source && edge.target === connection.target)) return false;
    const visited = new Set<string>();
    const queue = [connection.target];
    while (queue.length) {
      const current = queue.pop()!;
      if (current === connection.source) return false;
      if (visited.has(current)) continue;
      visited.add(current);
      queue.push(...connections.filter(edge => edge.source === current).map(edge => edge.target));
    }
    return true;
  }
  async function generate(nodeId: string) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.data.kind === "audio" || submittingRef.current.has(nodeId) || ["queued", "running"].includes(jobs[nodeId]?.status || node.data.generationStatus || "")) return;
    if (!node.data.prompt?.trim()) {
      configure(nodeId, { generationError: "Describe what you want to generate first." });
      return;
    }
    submittingRef.current.add(nodeId);
    setSubmitting(current => [...current, nodeId]);
    configure(nodeId, { generationError: undefined });
    try {
      const payload = JSON.stringify({ projectId: id, nodeId, snapshot: { nodes: nodes.map(n => ({ ...n, data: Object.fromEntries(Object.entries(n.data).filter(([key]) => !["generationError", "generationStatus", "jobId", "candidates"].includes(key))) })), edges }, options: { ...defaultGenerationOptions, resolution: node.data.kind === "video" ? "720p" : "1K", ...node.data.generationOptions } });
      // An ambiguous submission is retried with the exact same payload and ID, including after reload.
      const existing = generationAttempts.current[nodeId];
      if (existing && existing.payload !== payload) throw new Error("The previous submission is unresolved. Restore its inputs or refresh its job status before submitting a different request.");
      const attempt = existing || { payload, requestId: crypto.randomUUID() };
      generationAttempts.current[nodeId] = attempt;
      storeLocal(`sparkle:generation-attempts:${id}`, generationAttempts.current);
      const { job } = await request<{ job: StudioJob }>("/api/studio/generations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...JSON.parse(attempt.payload), requestId: attempt.requestId }),
      });
      delete generationAttempts.current[nodeId];
      storeLocal(`sparkle:generation-attempts:${id}`, generationAttempts.current);
      setJobs(current => ({ ...current, [nodeId]: job }));
      configure(nodeId, { jobId: job.id, generationStatus: job.status, generationError: job.error });
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status && (status < 500 || status === 503)) {
        delete generationAttempts.current[nodeId];
        storeLocal(`sparkle:generation-attempts:${id}`, generationAttempts.current);
      }
      configure(nodeId, { generationError: (error as Error).message });
    } finally {
      submittingRef.current.delete(nodeId);
      setSubmitting(current => current.filter(value => value !== nodeId));
    }
  }
  function accept(nodeId: string, candidate: GenerationCandidate) {
    update(nodeId, { content: candidate.content, url: candidate.url });
    setNotice("Result applied. Other candidates are kept; Undo restores your previous output.");
  }
  function resizePanel(width: number) {
    const max = Math.max(280, Math.min(650, (editorLayout.current?.clientWidth || 950) - 280));
    const next = Math.round(Math.max(280, Math.min(max, width)));
    setPanelWidth(next);
    try { storeLocal("sparkle:panel-width", next); } catch { /* Resizing works without persistence. */ }
  }
  function upload(target: string | null, replace = false) {
    uploadTarget.current = target;
    replaceUpload.current = replace;
    fileInput.current?.click();
  }
  async function uploadFile(file?: File) {
    if (!file) return;
    const targetId = uploadTarget.current;
    const targetNode = nodes.find((n) => n.id === targetId);
    const replace =
      replaceUpload.current || (targetNode?.data.kind === "audio" && !targetNode.data.url);
    setNotice("Uploading your asset...");
    try {
      const form = new FormData();
      form.append("file", file);
      const asset = await request<LibraryAsset>("/api/studio/upload", {
        method: "POST",
        body: form,
      });
      if (targetId && replace)
        update(targetId, {
          kind: asset.kind,
          url: asset.url,
          label: asset.name,
        });
      else
        add(asset.kind, {
          label: asset.name,
          url: asset.url,
          ...(targetNode
            ? {
                referenceFor: targetNode.id,
                caption: `Reference for ${targetNode.data.label}`,
              }
            : {}),
        }, targetNode?.id);
      const assets = readLocal<LibraryAsset[]>("sparkle:assets", []);
      storeLocal("sparkle:assets", [...assets, asset]);
      setNotice("Asset added to your canvas and library.");
    } catch (e) {
      setNotice((e as Error).message);
    }
    if (fileInput.current) fileInput.current.value = "";
  }
  async function send() {
    if (!prompt.trim() || busy || !(executionMode === "agents" ? team.length : activeSkills.length)) return;
    const input = prompt.trim();
    setPrompt("");
    const source = {
      prompt: input,
      context: referencedNodes.map(node => ({ id: node.id, label: node.data.label, content: node.data.content, kind: node.data.kind, caption: node.data.caption, url: node.data.url })),
      history: messages.filter(message => message.content && message.label !== "Connection notice").slice(-6).map(message => ({ role: message.role, content: message.content.slice(0, 20000), label: message.label })),
    };
    const userMessage: Message = { role: "user", content: input };
    if (executionMode === "agents") {
      const submission: AgentSubmission = { ...source, requestId: crypto.randomUUID(), projectId: id, agents: [...team] };
      // Retain the exact request for safe retries and recovery after navigation.
      setMessages(current => [...current, userMessage, { role: "assistant", label: "Agents", content: "", requestId: submission.requestId, agentInput: submission }]);
      return;
    }
    setBusy(true);
    setMessages(current => [...current, userMessage]);
    try {
      const key = JSON.stringify({ prompt: input, skills: activeSkills, context: source.context });
      if (skillAttempt.current && skillAttempt.current.key !== key) throw new Error("Resolve the previous skill request before submitting a different one.");
      skillAttempt.current ||= { key, body: JSON.stringify({ ...source, skills: activeSkills, requestId: crypto.randomUUID(), projectId: id }) };
      storeLocal(`sparkle:skill-attempt:${id}`, skillAttempt.current);
      const requestId = JSON.parse(skillAttempt.current.body).requestId as string;
      const result = await request<{ content: string }>("/api/studio/skills/run", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: skillAttempt.current.body,
      });
      skillAttempt.current = null; storeLocal(`sparkle:skill-attempt:${id}`, null);
      setMessages(current => [...current, { role: "assistant", content: result.content, requestId, label: activeSkills.join(" + ") }]);
    } catch (e) {
      setPrompt(input);
      if (skillAttempt.current) {
        const requestId = JSON.parse(skillAttempt.current.body).requestId as string;
        try {
          const { runs } = await request<{ runs: { requestId: string; status: string }[] }>(`/api/studio/skills/run?projectId=${encodeURIComponent(id)}`);
          if (runs.some(run => run.requestId === requestId && run.status === "failed") || ((e as Error & { status?: number }).status === 400)) { skillAttempt.current = null; storeLocal(`sparkle:skill-attempt:${id}`, null); }
        } catch { /* Keep the exact pending request until its status can be retrieved. */ }
      }
      setMessages(current => [...current, { role: "assistant", content: (e as Error).message, label: "Connection notice" }]);
    } finally { setBusy(false); }
  }
  function exportProject() {
    const file = new Blob(
      [JSON.stringify({ version: 1, name, nodes, edges }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9 -]/gi, "") || "sparkle-project"}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExporting(false);
  }
  async function exportVideo() {
    if (rendering) return;
    setRendering(true);
    try {
      exportAttempt.current ||= crypto.randomUUID();
      const { job } = await request<{ job: { id: string } }>("/api/studio/exports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: exportAttempt.current, projectId: id, snapshot: { nodes, edges }, aspectRatio: "16:9", resolution: "1080p" }) });
      const deadline = Date.now() + 15 * 60000;
      while (Date.now() < deadline) {
        const result = await request<{ job: { status: string; url?: string; error?: string } }>(`/api/studio/exports/${job.id}`);
        if (result.job.status === "failed") { exportAttempt.current = null; throw new Error(result.job.error || "Export failed."); }
        if (result.job.status === "succeeded" && result.job.url) {
          const link = document.createElement("a"); link.href = result.job.url; link.download = `${name.replace(/[^a-z0-9 -]/gi, "") || "sparkle-ad"}.mp4`; link.click();
          exportAttempt.current = null; setExporting(false); setNotice("Advertisement exported as MP4."); return;
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      throw new Error("Export is still running. Its status remains saved on the server.");
    } catch (error) {
      if ((error as Error & { status?: number }).status) exportAttempt.current = null;
      setNotice((error as Error).message);
    } finally { setRendering(false); }
  }
  async function publishTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const template: Template = {
      id: crypto.randomUUID(),
      name: String(data.get("name")),
      category: "Community",
      description: String(data.get("description")),
      image:
        nodes.find((n) => n.data.kind === "image" && n.data.url)?.data.url ||
        "/studio-object.svg",
      price: Number(data.get("price")),
      nodes,
      edges,
      projectId: id,
      published: true,
    };
    try {
      await storeLocal("sparkle:templates", [
        ...readLocal<Template[]>("sparkle:templates", []).filter(item => item.projectId !== id),
        template,
      ]);
      setPublish(false);
      setNotice("Template published to your local preview market.");
    } catch {
      setNotice("Could not save the template. Browser storage may be full.");
    }
  }

  const actions = {
    activeId: selected,
    referencedIds: referencedNodes.map(node => node.id),
    select: setSelected,
    edit: setEditing,
    ask: (nodeId: string) => {
      setSelected(nodeId);
      setChatOpen(true);
      // A conversation reference is independent of the active node editor.
      const selection = nodes.filter(node => node.selected);
      const additions = [...new Set([nodeId, ...(selection.length > 1 ? selection.map(node => node.id) : [])])];
      if (new Set([...referencedNodes.map(node => node.id), ...additions]).size > 16) {
        setNotice("You can reference up to 16 materials. Remove a reference to add another.");
        return;
      }
      setReferencedIds(current => {
        const next = [...new Set([...current.filter(id => nodes.some(node => node.id === id)), ...additions])];
        return next.slice(0, 16);
      });
    },
    upload,
    configure,
    beginEdit: remember,
    generate: (nodeId: string) => { void generate(nodeId); },
    accept,
    providers,
    jobs,
    submitting,
  };
  return (
    <StudioShell
      projectName={name}
      onRenameProject={ready ? async nextName => {
        if (id === "demo") storeLocal("sparkle:demo-name", nextName);
        else await request(`/api/projects/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nextName }),
        });
        setName(nextName);
      } : undefined}
      actions={
        <>
          <span className="save-status">
            {saveStatus.includes("saved") && <Check size={13} />}
            {saveStatus}
          </span>
          <button
            className="secondary-button compact"
            onClick={() => setPublish(true)}
          >
            Publish template
          </button>
          <button
            className="primary-button compact"
            onClick={() => setExporting(true)}
          >
            Export <ArrowUpRight size={14} />
          </button>
        </>
      }
    >
      <div className="editor-layout" ref={editorLayout}>
        <div className="canvas-column">
          <div className="canvas-stage">
            {loadError ? (
              <div className="canvas-empty">
                <h2>Could not open this project</h2>
                <p role="alert">{loadError}</p>
                <Link href="/" className="primary-button">
                  Back to projects
                </Link>
              </div>
            ) : !ready ? (
              <div className="canvas-empty">Opening your canvas...</div>
            ) : (
              <NodeActions.Provider value={actions}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodesChange={onNodesChange}
                  onNodeClick={(_, node) => setSelected(node.id)}
                  onPaneClick={() => {
                    setSelected(null);
                    setPanel(null);
                  }}
                  onNodeDragStart={remember}
                  onBeforeDelete={async () => {
                    remember();
                    return true;
                  }}
                  onEdgesChange={onEdgesChange}
                  isValidConnection={canConnect}
                  onConnect={connection => { if (canConnect(connection)) { remember(); setEdges(current => addEdge(connection, current)); } }}
                  onReconnect={(oldEdge, connection) => { if (canConnect(connection, oldEdge.id)) { remember(); setEdges(current => reconnectEdge(oldEdge, connection, current)); } }}
                  defaultEdgeOptions={{ type: "default", markerEnd: { type: MarkerType.ArrowClosed, color: "#1b1c1e" } }}
                  onMove={(_, viewport) => setZoom(viewport.zoom)}
                  fitView
                  fitViewOptions={{ padding: 0.15, maxZoom: 0.9 }}
                  minZoom={0.2}
                  maxZoom={2}
                  deleteKeyCode={["Backspace", "Delete"]}
                  nodesConnectable
                  edgesReconnectable
                  panOnDrag={[1, 2]}
                  panOnScroll
                  zoomOnScroll={false}
                  selectionOnDrag
                  panActivationKeyCode="Space"
                  onlyRenderVisibleElements={false}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    color="rgba(15,15,17,.24)"
                    gap={22}
                    size={1.25}
                  />
                </ReactFlow>
              </NodeActions.Provider>
            )}
            {ready && nodes.length === 0 && (
              <div className="canvas-empty">
                <span className="eyebrow">A FRESH START</span>
                <h2>Every idea starts somewhere.</h2>
                <p>
                  Add a thought, drop in an asset,
                  <br />
                  or start a conversation with your AI team.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    const nodeId = add("text");
                    setEditing(nodeId);
                  }}
                >
                  Add your first idea <Plus size={15} />
                </button>
              </div>
            )}
            <div className="canvas-toolbox glass-surface">
              {(["text", "image", "video", "audio"] as AssetKind[]).map(
                (kind) => {
                  const Icon = typeIcons[kind];
                  return (
                    <button
                      key={kind}
                      aria-label={`Add ${kind}`}
                      title={`Add ${kind}`}
                      onClick={() => add(kind)}
                    >
                      <Icon size={19} />
                    </button>
                  );
                },
              )}
              <div className="tool-divider" />
              <button
                aria-label="Upload asset"
                title="Upload asset"
                onClick={() => upload(null)}
              >
                <Upload size={19} />
              </button>
            </div>
            <div className="canvas-bottom">
              <div className="viewport-controls glass-surface">
                <button
                  aria-label="Undo"
                  disabled={!history.past.length}
                  onClick={undo}
                >
                  <Undo2 size={16} />
                </button>
                <button
                  aria-label="Redo"
                  disabled={!history.future.length}
                  onClick={redo}
                >
                  <Redo2 size={16} />
                </button>
                <i />
                <button aria-label="Zoom out" onClick={() => flow.zoomOut()}>
                  <Minus size={15} />
                </button>
                <button className="zoom-value" onClick={() => flow.zoomTo(1)}>
                  {Math.round(zoom * 100)}%
                </button>
                <button aria-label="Zoom in" onClick={() => flow.zoomIn()}>
                  <Plus size={15} />
                </button>
                <button
                  aria-label="Fit canvas"
                  onClick={() =>
                    flow.fitView({ padding: 0.15, maxZoom: 0.9, duration: 300 })
                  }
                >
                  <Scan size={16} />
                </button>
              </div>
              <span className="canvas-hint">Scroll to pan · Pinch to zoom</span>
              <button
                className={`timeline-toggle glass-surface ${timelineOpen ? "selected" : ""}`}
                onClick={() => setTimelineOpen(!timelineOpen)}
              >
                <Layers size={15} />
                Timeline
              </button>
            </div>
            {!chatOpen && (
              <button
                className="reopen-chat glass-surface"
                onClick={() => setChatOpen(true)}
              >
                <MessageSquare size={16} /> AI studio
              </button>
            )}
          </div>
          {timelineOpen && (
            <section className="timeline-panel">
              <header>
                <button
                  className="icon-button"
                  aria-label={playing ? "Pause timeline" : "Play timeline"}
                  onClick={() => setPlaying(!playing)}
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <strong>Final composition</strong>
                <span>
                  {playhead.toFixed(1)}s of {totalDuration}s
                </span>
                <button
                  className="text-button"
                  onClick={() => setPreview(true)}
                >
                  Preview <Expand size={13} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Close timeline"
                  onClick={() => setTimelineOpen(false)}
                >
                  <X size={15} />
                </button>
              </header>
              <div className="timeline-scroll">
                <div className="time-ruler">
                  <span />
                  {Array.from({ length: 6 }, (_, i) => (
                    <span key={i}>{Math.round((i * totalDuration) / 5)}s</span>
                  ))}
                </div>
                {["Video", "Graphics", "Captions", "Voiceover", "Music"].map(
                  (track) => (
                    <div className="timeline-track" key={track}>
                      <span>{track}</span>
                      <div
                        className="track-lane"
                        onDoubleClick={() =>
                          add(
                            track === "Captions"
                              ? "text"
                              : track === "Music" || track === "Voiceover"
                                ? "audio"
                                : "image",
                            { track },
                          )
                        }
                      >
                        <i
                          className="playhead"
                          style={{
                            left: `${(playhead / totalDuration) * 100}%`,
                          }}
                        />
                        {nodes
                          .filter(
                            (n) =>
                              (n.data.track ||
                                (n.data.kind === "text"
                                  ? "Captions"
                                  : n.data.kind === "audio"
                                    ? "Music"
                                    : "Video")) === track,
                          )
                          .map((n) => (
                            <button
                              key={n.id}
                              onClick={() => setSelected(n.id)}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditing(n.id);
                              }}
                              className={`timeline-clip ${selected === n.id ? "selected" : ""}`}
                              style={{
                                left: `${(Number(n.data.start || 0) / totalDuration) * 100}%`,
                                width: `${(Number(n.data.duration || 5) / totalDuration) * 100}%`,
                              }}
                            >
                              {n.data.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  ),
                )}
                <input
                  aria-label="Timeline playhead"
                  type="range"
                  min={0}
                  max={totalDuration}
                  step={0.1}
                  value={playhead}
                  onChange={(e) => setPlayhead(Number(e.target.value))}
                />
              </div>
              <small className="timeline-footnote">
                Double-click a clip to edit its content and timing. Preview
                shows the visual sequence.
              </small>
            </section>
          )}
        </div>
        {chatOpen && (
          <aside className="ai-panel" style={{ width: panelWidth }}>
            <div className="ai-resize-handle" role="separator" aria-label="Resize AI studio" aria-orientation="vertical" aria-valuemin={280} aria-valuemax={650} aria-valuenow={panelWidth} tabIndex={smallScreen ? -1 : 0}
              onPointerDown={event => { panelDrag.current = { x: event.clientX, width: panelWidth }; event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); }}
              onPointerMove={event => { if (panelDrag.current) resizePanel(panelDrag.current.width + panelDrag.current.x - event.clientX); }}
              onPointerUp={event => { panelDrag.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}
              onPointerCancel={() => { panelDrag.current = null; }}
              onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); resizePanel(panelWidth + (event.key === "ArrowLeft" ? 20 : -20)); } }} />
            <header className="ai-header">
              <h2>AI Studio Partner</h2>
              <button
                className="icon-button"
                aria-label="Close AI studio"
                onClick={() => setChatOpen(false)}
              >
                <PanelRightClose size={18} />
              </button>
            </header>
            <div className="team-section">
              <div className="team-heading">
                <span>
                  Creative team <small>{team.length}</small>
                </span>
                <button
                  onClick={() => { setExecutionMode("agents"); setPanel(panel === "agents" ? null : "agents"); }}
                >
                  <Plus size={13} /> Add agent
                </button>
              </div>
              <div className="team-chips">
                {team.map((agent, i) => (
                  <button
                    key={agent}
                    onClick={() => { setTeam(team.filter((a) => a !== agent)); setExecutionMode("agents"); }}
                    title={`Remove ${agent}`}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {agent}
                    <X size={11} />
                  </button>
                ))}
                {!team.length && (
                  <small>No agents selected. Add a specialist to begin.</small>
                )}
              </div>
              <button
                className="skills-trigger"
                onClick={() => { setExecutionMode("skills"); setPanel(panel === "skills" ? null : "skills"); }}
              >
                <span>
                  Skills{" "}
                  <small>
                    {activeSkills.length
                      ? `${activeSkills.length} added`
                      : "Extend your workflow"}
                  </small>
                </span>
                <Plus size={14} />
              </button>
              {activeSkills.length > 0 && (
                <div className="skill-chips">
                  {activeSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => {
                        const next = activeSkills.filter((s) => s !== skill);
                        setActiveSkills(next);
                        setExecutionMode(next.length ? "skills" : "agents");
                      }}
                    >
                      {skill}
                      <X size={11} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {panel && (
              <div className="assistant-picker" role="region" aria-label={panel === "agents" ? "Available agents" : "Available skills"}>
                  <button className="picker-close"
                    aria-label="Close picker"
                    onClick={() => setPanel(null)}
                  >
                    <X size={15} />
                  </button>
                <div className="picker-list">
                {(panel === "agents" ? agents : skills).map((item) => {
                  const list = panel === "agents" ? team : activeSkills;
                  return (
                    <button
                      className="picker-item"
                      aria-pressed={list.includes(item.name)}
                      key={item.name}
                      onClick={() => {
                        const next = list.includes(item.name)
                          ? list.filter((n) => n !== item.name)
                          : [...list, item.name];
                        if (panel === "agents") { setTeam(next); setExecutionMode("agents"); }
                        else { setActiveSkills(next); setExecutionMode(next.length ? "skills" : "agents"); }
                      }}
                    >
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.role}</small>
                      </span>
                      {list.includes(item.name) ? (
                        <Check size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                  );
                })}
                </div>
              </div>
            )}
            <div className="chat-messages">
              <div className="assistant-welcome">
                <p>
                  Tell your team what you have in mind.
                </p>
                <div className="suggestion-list">
                  {[
                    "Help me shape the creative direction",
                    "Write a 15-second product script",
                    "Refine the selected copy",
                  ].map((text) => (
                    <button key={text} onClick={() => setPrompt(text)}>
                      {text}
                      <ArrowUpRight size={13} />
                    </button>
                  ))}
                </div>
              </div>
              {messages.map((message, i) => (
                <article key={i} className={`chat-message ${message.role}`}>
                  <span>
                    {message.role === "user"
                      ? "You"
                      : message.label || "AI studio"}
                  </span>
                  {message.runId || message.agentInput ? <AgentRunMessage
                    runId={message.runId}
                    submission={message.agentInput}
                    onUpdate={run => setMessages(current => current.map(item => item.requestId === run.requestId || item.runId === run.id ? { ...item, runId: run.id, content: agentRunText(run).slice(0, 20000) } : item))}
                    onAdd={(agentName, content) => add("text", { label: agentName, content, caption: "Review before use" })}
                  /> : <p>{message.content}</p>}
                  {message.role === "assistant" &&
                    message.label !== "Connection notice" && !message.runId && !message.agentInput && (
                      <button
                        className="text-button"
                        onClick={() =>
                          add("text", {
                            label: "AI draft",
                            content: message.content,
                            caption: "Review before use",
                          })
                        }
                      >
                        Add to canvas <Plus size={13} />
                      </button>
                    )}
                </article>
              ))}
              {busy && (
                <div className="thinking">
                  Your skills are working<span>...</span>
                </div>
              )}
              <div ref={messageEnd} />
            </div>
            <div className="chat-compose">
              {referencedNodes.length > 0 && (
                <div className="context-references" role="group" aria-label="Referenced materials">
                  <span className="context-heading">Referencing</span>
                  {referencedNodes.map(node => (
                    <div className="context-chip" key={node.id} title={`Referencing: ${node.data.label}`}>
                      <span>{node.data.label}</span>
                      <button aria-label={`Remove reference: ${node.data.label}`} onClick={() => setReferencedIds(current => current.filter(id => id !== node.id))}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <textarea
                  aria-label={executionMode === "agents" ? "Message your creative team" : "Run your selected skills"}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What would you like to create?"
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                />
                <div className="composer-footer">
                  <button
                    className="send-button"
                    disabled={busy || !prompt.trim() || !(executionMode === "agents" ? team.length : activeSkills.length)}
                    aria-label="Send message"
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </form>

            </div>
          </aside>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg"
        onChange={(e) => void uploadFile(e.target.files?.[0])}
      />
      {editNode && (
        <EditElement
          node={editNode}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            update(editNode.id, data);
            setEditing(null);
          }}
          onDelete={() => {
            remember();
            setNodes(nodes.filter((n) => n.id !== editNode.id));
            setEdges(
              edges.filter(
                (e) => e.source !== editNode.id && e.target !== editNode.id,
              ),
            );
            setEditing(null);
          }}
          onDuplicate={() => {
            add(editNode.data.kind, {
              ...editNode.data,
              label: `${editNode.data.label} copy`,
              jobId: undefined,
              generationStatus: undefined,
              generationError: undefined,
            });
            setEditing(null);
          }}
          onUpload={() => upload(editNode.id, true)}
        />
      )}
      {publish && (
        <Dialog title="Publish your workflow" onClose={() => setPublish(false)}>
          <p className="dialog-intro">
            Share an editable starting point in the local template market. This
            preview does not process payments.
          </p>
          <form className="studio-form" onSubmit={publishTemplate}>
            <label>
              Template name
              <input name="name" required maxLength={80} defaultValue={name} />
            </label>
            <label>
              Description
              <textarea
                name="description"
                required
                placeholder="What can someone create with this workflow?"
              />
            </label>
            <label>
              Price in USD
              <input
                name="price"
                type="number"
                min="0"
                max="10000"
                step="0.01"
                defaultValue={0}
              />
            </label>
            <button className="primary-button" disabled={!nodes.length}>
              Publish preview template
            </button>
          </form>
        </Dialog>
      )}
      {exporting && (
        <Dialog
          title="Take your project with you"
          onClose={() => setExporting(false)}
        >
          <p className="dialog-intro">
            Download the editable canvas, asset references and track timings as
            a JSON project file.
          </p>
          <div className="export-card">
            <FileText size={24} />
            <div>
              <strong>Editable project</strong>
              <p>{nodes.length} elements · JSON</p>
            </div>
            <Check size={17} />
          </div>
          <p className="form-note">
            Export an MP4 with timeline clips, captions and audio, or keep the
            editable JSON project. Media remains on this server.
          </p>
          <button className="primary-button full-width" onClick={exportProject}>
            Download project
          </button>
          <button className="secondary-button full-width" disabled={rendering} onClick={exportVideo}>
            {rendering ? "Rendering MP4…" : "Download MP4"}
          </button>
        </Dialog>
      )}
      {preview && (
        <Dialog
          title="Composition preview"
          onClose={() => {
            setPreview(false);
            setPlaying(false);
          }}
          wide
        >
          <div className="composition-preview">
            {nodes
              .filter(
                (n) =>
                  n.data.kind !== "text" &&
                  n.data.kind !== "audio" &&
                  playhead >= Number(n.data.start || 0) &&
                  playhead <
                    Number(n.data.start || 0) + Number(n.data.duration || 5),
              )
              .slice(-1)
              .map((n) =>
                n.data.url ? (
                  n.data.kind === "video" ? (
                    <video key={n.id} src={n.data.url} controls />
                  ) : (
                    <img key={n.id} src={n.data.url} alt={n.data.label} />
                  )
                ) : (
                  <p key={n.id}>Add media to {n.data.label}</p>
                ),
              )}
            {!nodes.some(
              (n) =>
                n.data.url &&
                n.data.kind !== "audio" &&
                playhead >= Number(n.data.start || 0) &&
                playhead <
                  Number(n.data.start || 0) + Number(n.data.duration || 5),
            ) && <p>No visual at this point in the timeline.</p>}
          </div>
          <div className="preview-player">
            <button
              className="icon-button"
              aria-label="Play preview"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <input
              aria-label="Preview position"
              type="range"
              min={0}
              max={totalDuration}
              step={0.1}
              value={playhead}
              onChange={(e) => setPlayhead(Number(e.target.value))}
            />
            <span>{playhead.toFixed(1)}s</span>
          </div>
        </Dialog>
      )}
      {notice && (
        <div className="studio-toast" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </StudioShell>
  );
}

function EditElement({
  node,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onUpload,
}: {
  node: StudioNode;
  onClose: () => void;
  onSave: (data: Partial<StudioData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpload: () => void;
}) {
  const [data, setData] = useState(node.data);
  return (
    <Dialog title="Edit element" onClose={onClose}>
      <form
        className="studio-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(data);
        }}
      >
        <label>
          Name
          <input
            required
            value={data.label}
            onChange={(e) => setData({ ...data, label: e.target.value })}
          />
        </label>
        {data.kind === "text" ? (
          <label>
            Content
            <textarea
              className="large-textarea"
              value={data.content || ""}
              onChange={(e) => setData({ ...data, content: e.target.value })}
            />
          </label>
        ) : (
          <>
            <p className="form-note">
              Replace the source media using a local file. Your original asset
              remains in the library.
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                onClose();
                onUpload();
              }}
            >
              Replace {data.kind}
              <Upload size={14} />
            </button>
          </>
        )}
        <div className="form-columns">
          <label>
            Start in seconds
            <input
              type="number"
              min={0}
              max={3600}
              step="0.1"
              value={data.start || 0}
              onChange={(e) =>
                setData({ ...data, start: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Duration in seconds
            <input
              type="number"
              min="0.1"
              max={3600}
              step="0.1"
              value={data.duration ?? 5}
              onChange={(e) =>
                setData({ ...data, duration: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <label>
          Track
          <select
            value={
              data.track ||
              (data.kind === "text"
                ? "Captions"
                : data.kind === "audio"
                  ? "Music"
                  : "Video")
            }
            onChange={(e) => setData({ ...data, track: e.target.value })}
          >
            {["Video", "Graphics", "Captions", "Voiceover", "Music"].map(
              (track) => (
                <option key={track}>{track}</option>
              ),
            )}
          </select>
        </label>
        <div className="form-actions">
          <button
            type="button"
            className="icon-button"
            title="Delete element"
            aria-label="Delete element"
            onClick={onDelete}
          >
            <Trash2 size={17} />
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onDuplicate}
          >
            <Copy size={14} />
            Duplicate
          </button>
          <button className="primary-button">Save changes</button>
        </div>
      </form>
    </Dialog>
  );
}

export function CanvasWorkspace({ id }: { id: string }) {
  return (
    <ReactFlowProvider>
      <CanvasEditor key={id} id={id} />
    </ReactFlowProvider>
  );
}
