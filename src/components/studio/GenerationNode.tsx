"use client";

/* eslint-disable @next/next/no-img-element -- Canvas previews use original media URLs. */
import { createContext, useContext, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowUpRight, Check, FileText, Image as ImageIcon, Music2, Plus, Video, X } from "lucide-react";
import type { AssetKind, StudioData, StudioNode } from "./data";
import type { GenerationCandidate, ProviderSummary, StudioGenerationOptions, StudioJob } from "../../../schemas/studio-generation";

export const kindIcons = { text: FileText, image: ImageIcon, video: Video, audio: Music2 };
export const defaultGenerationOptions: StudioGenerationOptions = { aspectRatio: "16:9", resolution: "1K", duration: 5, count: 1 };
export const NodeActions = createContext<{
  activeId: string | null;
  edit: (id: string) => void;
  select: (id: string) => void;
  ask: (id: string) => void;
  upload: (id: string) => void;
  configure: (id: string, data: Partial<StudioData>) => void;
  beginEdit: () => void;
  generate: (id: string) => void;
  accept: (id: string, candidate: GenerationCandidate) => void;
  addLinked: (id: string, kind: AssetKind, upstream: boolean) => void;
  inputs: (id: string) => StudioNode[];
  disconnect: (source: string, target: string) => void;
  providers: ProviderSummary[];
  jobs: Record<string, StudioJob>;
  submitting: string[];
}>({ activeId: null, edit: () => {}, select: () => {}, ask: () => {}, upload: () => {}, configure: () => {}, beginEdit: () => {}, generate: () => {}, accept: () => {}, addLinked: () => {}, inputs: () => [], disconnect: () => {}, providers: [], jobs: {}, submitting: [] });

export function GenerationNode({ id, data, selected }: NodeProps<StudioNode>) {
  const actions = useContext(NodeActions);
  const active = actions.activeId === id;
  const [adding, setAdding] = useState<"upstream" | "downstream" | null>(null);
  const Icon = kindIcons[data.kind] || FileText;
  const provider = actions.providers.find(p => p.kind === data.kind);
  const options = { ...defaultGenerationOptions, resolution: data.kind === "video" ? "720p" as const : "1K" as const, ...data.generationOptions };
  const job = actions.jobs[id];
  const busy = actions.submitting.includes(id) || ["queued", "running"].includes(job?.status || data.generationStatus || "");
  const inputs = actions.inputs(id);
  const candidates = data.candidates || [];
  function option(patch: Partial<StudioGenerationOptions>) {
    actions.beginEdit(); actions.configure(id, { generationOptions: { ...options, ...patch } });
  }

  return <article className={`asset-node generation-node ${selected || active ? "is-selected" : ""}`}>
    <Handle type="target" position={Position.Left} id="input" className="studio-handle input-handle" aria-label={`Connect input to ${data.label}`}><Plus size={12} /></Handle>
    <Handle type="source" position={Position.Right} id="output" className="studio-handle output-handle" aria-label={`Connect output from ${data.label}`}><Plus size={12} /></Handle>
    <header className="node-drag"><span className="node-kind"><Icon size={14} />{data.kind}</span><span className="node-connection-count">{inputs.length ? `${inputs.length} input${inputs.length > 1 ? "s" : ""}` : "Input"}</span></header>
    <div className={`node-preview preview-${data.kind}`} onClick={() => actions.select(id)} onDoubleClick={() => actions.edit(id)}>
      {data.kind === "text" ? <div className="text-preview"><span className="eyebrow">{data.caption || "TEXT"}</span><p>{data.content || "Write a prompt below to generate text, or add your own."}</p></div> : data.url ? data.kind === "image" ? <img src={data.url} alt={data.label} draggable={false} /> : data.kind === "video" ? <video src={data.url} controls className="nodrag nowheel" preload="metadata" /> : <div className="audio-preview"><audio src={data.url} controls className="nodrag nowheel" /></div> : <button className="media-placeholder nodrag" onClick={() => data.kind === "audio" ? actions.upload(id) : actions.select(id)}><Icon size={36} strokeWidth={1} /><span>{data.kind === "audio" ? "Upload audio" : `Generate ${data.kind}`}</span><small>{data.kind === "audio" ? "Add a source file" : "Add references and describe your result"}</small></button>}
    </div>
    <div className="node-caption"><strong>{data.label}</strong><button type="button" className="generate-submit nodrag" disabled={busy} aria-label={`Generate ${data.kind}`} onClick={() => { actions.select(id); if (active) actions.generate(id); }}>{busy ? "Generating..." : "Generate"}</button></div>
    <footer className="nodrag"><button onClick={() => actions.edit(id)}>Edit</button><button onClick={() => actions.upload(id)}>Add asset</button><button onClick={() => actions.ask(id)}>Ask AI <ArrowUpRight size={12} /></button></footer>
    {active && <>
      <div className="node-flow-controls nodrag"><button onClick={() => setAdding(adding === "upstream" ? null : "upstream")}><Plus size={12} />Input</button><span>Connect assets to pass context</span><button onClick={() => setAdding(adding === "downstream" ? null : "downstream")}>Next<Plus size={12} /></button></div>
      {adding && <div className="linked-node-menu nodrag"><span>Add {adding}</span>{(["text", "image", "video", "audio"] as AssetKind[]).map(kind => <button key={kind} onClick={() => { actions.addLinked(id, kind, adding === "upstream"); setAdding(null); }}>{kind[0].toUpperCase() + kind.slice(1)}</button>)}</div>}
      {data.kind !== "audio" && <form className="node-generation nodrag nowheel" onSubmit={e => { e.preventDefault(); actions.generate(id); }}>
        <div className="generation-references"><button type="button" className="reference-upload" aria-label="Add reference asset" onClick={() => actions.upload(id)}><Plus size={18} /></button>{inputs.map(node => <span key={node.id} className="reference-chip"><span title={node.data.label}>{node.data.label}</span><button type="button" aria-label={`Disconnect ${node.data.label}`} onClick={() => actions.disconnect(node.id, id)}><X size={10} /></button></span>)}</div>
        <textarea aria-label={`Prompt for ${data.label}`} placeholder={`Describe the ${data.kind} you want to generate. Connected inputs are included.`} value={data.prompt || ""} maxLength={12000} onFocus={actions.beginEdit} onChange={e => actions.configure(id, { prompt: e.target.value })} />
        <div className="generation-settings"><label>Model<select aria-label={`Model for ${data.label}`} value={options.model || provider?.defaultModel || ""} onChange={e => option({ model: e.target.value })}><option value="">{provider?.defaultModel || "Configure model"}</option>{provider?.models.map(model => <option key={model} value={model}>{model}</option>)}</select></label>{data.kind !== "text" && <><label>Ratio<select aria-label="Aspect ratio" value={options.aspectRatio} onChange={e => option({ aspectRatio: e.target.value as StudioGenerationOptions["aspectRatio"] })}>{["1:1", "16:9", "9:16", "4:3", "3:4"].map(ratio => <option key={ratio}>{ratio}</option>)}</select></label><label>Size<select aria-label="Resolution" value={options.resolution} onChange={e => option({ resolution: e.target.value as StudioGenerationOptions["resolution"] })}>{(data.kind === "video" ? ["720p", "1080p"] : ["1K", "2K"]).map(value => <option key={value}>{value}</option>)}</select></label></>}{data.kind === "video" ? <label>Length<select aria-label="Video duration" value={options.duration} onChange={e => option({ duration: Number(e.target.value) })}>{[5, 10, 15].map(value => <option key={value} value={value}>{value}s</option>)}</select></label> : <label>Results<select aria-label="Candidate count" value={options.count} onChange={e => option({ count: Number(e.target.value) })}>{[1, 2, 3, 4].map(value => <option key={value}>{value}</option>)}</select></label>}</div>
        <div className="generation-footer"><small>{busy ? job?.status === "queued" ? "Queued" : "Generating..." : provider?.configured ? "Provider connected" : "API not configured"}</small></div>
        {(data.generationError || job?.error) && <p className="generation-error" role="alert">{data.generationError || job?.error}</p>}
      </form>}
      {candidates.length > 0 && <div className="generation-candidates nodrag nowheel"><span className="eyebrow">RESULTS · CHOOSE TO APPLY</span><div>{candidates.map((candidate, index) => <button key={candidate.id} onClick={() => actions.accept(id, candidate)} title={`Use candidate ${index + 1}`} aria-label={`Use candidate ${index + 1}`} className={(candidate.url && data.url === candidate.url) || (candidate.content && data.content === candidate.content) ? "accepted" : ""}>{candidate.kind === "image" ? <img src={candidate.url} alt={`Candidate ${index + 1}`} /> : candidate.kind === "video" ? <video src={candidate.url} preload="metadata" /> : <p>{candidate.content?.slice(0, 130)}</p>}<span>{String(index + 1).padStart(2,"0")}<Check size={12} /></span></button>)}</div></div>}
    </>}
  </article>;
}
