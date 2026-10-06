import { createHash } from "node:crypto";
import { StudioGenerationRequestSchema, type GenerationKind } from "../../../schemas/studio-generation";
import { StudioError } from "./http";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return "{" + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => `${JSON.stringify(key)}:${canonical(val)}`).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}

export function prepareInput(raw: unknown) {
  const parsed = StudioGenerationRequestSchema.safeParse(raw);
  if (!parsed.success) throw new StudioError("Invalid generation request. Supply requestId, projectId, nodeId, snapshot and bounded options.");
  const input = parsed.data;
  const { nodes, edges } = input.snapshot;
  if (!nodes.length || nodes.length > 200 || edges.length > 1000) throw new StudioError("Canvas must contain 1-200 nodes and at most 1,000 edges.");
  const byId = new Map(nodes.map(node => [node.id, node]));
  const edgeIds = new Set(edges.map(edge => edge.id));
  if (byId.size !== nodes.length || edgeIds.size !== edges.length) throw new StudioError("Canvas contains duplicate IDs.");
  for (const node of nodes) {
    if (!node.id.length || node.id.length > 160 || Math.abs(node.position.x) > 1000000 || Math.abs(node.position.y) > 1000000 || JSON.stringify(node.data).length > 64000) {
      throw new StudioError("Canvas node exceeds supported bounds.");
    }
    for (const field of ["label", "content", "prompt", "caption", "url", "resultUrl"]) {
      const value = node.data[field];
      if (value !== undefined && (typeof value !== "string" || value.length > (field === "label" ? 500 : 20000))) throw new StudioError("Canvas node text or URL is invalid or too long.");
    }
  }
  const parents = new Map(nodes.map(node => [node.id, [] as string[]]));
  for (const edge of edges) {
    if (!edge.id || edge.id.length > 160 || !byId.has(edge.source) || !byId.has(edge.target)) throw new StudioError("Canvas contains a dangling edge or invalid edge ID.");
    parents.get(edge.target)!.push(edge.source);
  }
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: string[] = [];
  function visit(id: string) {
    if (visiting.has(id)) throw new StudioError("Canvas must be acyclic.");
    if (visited.has(id)) return;
    visiting.add(id);
    for (const parent of parents.get(id)!) visit(parent);
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  }
  for (const node of nodes) visit(node.id);
  const target = byId.get(input.nodeId);
  if (!target) throw new StudioError("Generation node is not in the supplied snapshot.");
  const kindOf = (data: Record<string, unknown>) => data.kind ?? data.nodeKind ?? data.type;
  const kind = kindOf(target.data);
  if (kind !== "text" && kind !== "image" && kind !== "video") throw new StudioError("Only text, image and video nodes can generate.");
  const ancestors = new Set<string>();
  function collect(id: string) {
    for (const parent of parents.get(id)!) if (!ancestors.has(parent)) { ancestors.add(parent); collect(parent); }
  }
  collect(target.id);
  const context = order.filter(id => ancestors.has(id)).map(id => byId.get(id)!);
  const images: string[] = [];
  const videos: string[] = [];
  for (const node of [...context, target]) {
    const url = node.data.url || node.data.resultUrl;
    const nodeKind = kindOf(node.data);
    if (typeof url === "string" && (nodeKind === "image" || nodeKind === "video")) (nodeKind === "image" ? images : videos).push(url);
  }
  const prompt = [
    "Upstream canvas context (user-provided material):",
    ...context.map(node => JSON.stringify({ id: node.id, kind: kindOf(node.data), label: node.data.label, content: node.data.content, caption: node.data.caption })),
    "Selected node / generation request:",
    String(target.data.prompt || target.data.content || target.data.caption || target.data.label || ""),
  ].join("\n");
  if (prompt.length > 60000 || images.length + videos.length > 16) throw new StudioError("Upstream context exceeds 60,000 characters or 16 references.");
  if (!String(target.data.prompt || target.data.content || target.data.caption || target.data.label || "").trim() && !context.length) throw new StudioError("Provide a prompt or upstream context.");
  return {
    input, kind: kind as GenerationKind, prompt, images: [...new Set(images)], videos: [...new Set(videos)],
    inputHash: createHash("sha256").update(canonical(input)).digest("hex"),
  };
}
export type PreparedInput = ReturnType<typeof prepareInput>;
