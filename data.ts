import type { Node, Edge } from "@xyflow/react";
import type { GenerationCandidate, StudioGenerationOptions } from "../../../schemas/studio-generation";

export type AssetKind = "text" | "image" | "video" | "audio";
export type StudioData = Record<string, unknown> & {
  label: string;
  kind: AssetKind;
  content?: string;
  url?: string;
  caption?: string;
  start?: number;
  duration?: number;
  track?: string;
  prompt?: string;
  generationOptions?: StudioGenerationOptions;
  jobId?: string;
  generationStatus?: "queued" | "running" | "succeeded" | "failed";
  generationError?: string;
  candidates?: GenerationCandidate[];
};
export type StudioNode = Node<StudioData>;
export type LibraryAsset = {
  id: string;
  name: string;
  kind: AssetKind;
  url: string;
};
export type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  price: number;
  nodes?: StudioNode[];
  edges?: Edge[];
  published?: boolean;
  projectId?: string;
};
export type Order = {
  id: string;
  name: string;
  amount: number;
  kind: string;
  date: string;
};

export const agents = [
  {
    name: "Creative Director",
    role: "Campaign strategy, creative direction and production planning.",
  },
  {
    name: "Scriptwriter",
    role: "Hooks, selling points, timed scripts and voiceover copy.",
  },
  {
    name: "Product Visual Designer",
    role: "Product imagery, packaging and detail shots.",
  },
  {
    name: "Character Designer",
    role: "Character references and consistent visual identity.",
  },
  {
    name: "Scene Designer",
    role: "Locations, lighting, environments and atmosphere.",
  },
  {
    name: "Storyboard Designer",
    role: "Shot breakdowns, framing, movement and timing.",
  },
  {
    name: "Video Director",
    role: "Video shot instructions and generation planning.",
  },
  {
    name: "Sound Director",
    role: "Voiceover, music direction and sound design.",
  },
  {
    name: "Final Editor",
    role: "Shot order, captions, timing and final composition.",
  },
];
export const skills = [
  {
    name: "Reference breakdown",
    role: "Describe the rhythm and shot structure of a supplied reference.",
  },
  {
    name: "Motion graphics",
    role: "Plan editable text, data and graphic animation.",
  },
  {
    name: "Caption polish",
    role: "Refine captions for clarity, length and brand tone.",
  },
  {
    name: "Brand check",
    role: "Check copy and creative direction against the supplied brand brief.",
  },
];
export const templates: Template[] = [
  {
    id: "quiet-form",
    name: "The quiet product film",
    category: "Product",
    description:
      "A considered product introduction. Three scenes, a simple story, room for your brand.",
    image: "/studio-product.svg",
    price: 0,
  },
  {
    id: "sculpted-light",
    name: "Sculpted in light",
    category: "Brand",
    description:
      "A visual-led brand story built around texture, form and movement.",
    image: "/studio-object.svg",
    price: 24,
  },
  {
    id: "daily-ritual",
    name: "An everyday ritual",
    category: "Lifestyle",
    description: "Turn a small everyday moment into a personal product story.",
    image: "/studio-product.svg",
    price: 18,
  },
  {
    id: "new-perspective",
    name: "A new perspective",
    category: "Product",
    description:
      "A detail-first reveal with editable benefit cards and a closing call to action.",
    image: "/studio-object.svg",
    price: 0,
  },
];

export function exampleNodes(): StudioNode[] {
  return [
    {
      id: "brief",
      type: "asset",
      position: { x: 40, y: 40 },
      data: {
        kind: "text",
        label: "The creative brief",
        content:
          "A little less noise.\nA little more you.\n\nA 15-second product film for FORM.\nSoft light, honest textures and a slower pace.\n\nAudience: the everyday minimalist.\nClose: Make space for your daily ritual.",
        caption: "Creative direction",
        track: "Captions",
        start: 0,
        duration: 5,
      },
    },
    {
      id: "product",
      type: "asset",
      position: { x: 415, y: 40 },
      data: {
        kind: "image",
        label: "01  ·  The product",
        url: "/studio-product.svg",
        caption: "Product reference · Original artwork",
        track: "Video",
        start: 0,
        duration: 5,
      },
    },
    {
      id: "scene",
      type: "asset",
      position: { x: 790, y: 40 },
      data: {
        kind: "image",
        label: "02  ·  Light and form",
        url: "/studio-object.svg",
        caption: "Scene reference · Original artwork",
        track: "Video",
        start: 5,
        duration: 5,
      },
    },
    {
      id: "story",
      type: "asset",
      position: { x: 450, y: 780 },
      data: {
        kind: "text",
        label: "The shot list",
        content:
          "00:00   Light moves across the surface.\n00:05   A close-up reveals the texture.\n00:10   The product, simply framed.\n\nFORM. Make space for your daily ritual.",
        caption: "Storyboard draft",
        track: "Captions",
        start: 5,
        duration: 10,
      },
    },
  ];
}

export function exampleEdges(): Edge[] {
  return [
    { id: "brief-product", source: "brief", target: "product" },
    { id: "product-scene", source: "product", target: "scene" },
    { id: "brief-story", source: "brief", target: "story" },
  ];
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "The request could not be completed.");
  return data as T;
}

export function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function storeLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("sparkle-storage"));
}

export async function newProject(
  mode: "free" | "basic" | "template",
  name: string,
  nodes?: StudioNode[],
  basicType = "t2v",
  subjectId?: string,
  edges?: Edge[],
) {
  const result = await request<{ project: { id: string } }>("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mode,
      basicType: mode === "basic" ? basicType : undefined,
      industry: "互联网",
      subjectId,
    }),
  });
  if (nodes) {
    try {
      await request(`/api/projects/${result.project.id}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: nodes.map(n => ({ ...n, data: { ...n.data, jobId: undefined, generationStatus: undefined, generationError: undefined } })),
          edges: edges ?? (nodes.some(n => n.id === "brief") && nodes.some(n => n.id === "product") ? exampleEdges().filter(e => nodes.some(n => n.id === e.source) && nodes.some(n => n.id === e.target)) : []),
        }),
      });
    } catch (error) {
      await request(`/api/projects/${result.project.id}`, {
        method: "DELETE",
      }).catch(() => {});
      throw error;
    }
  }
  return result.project.id;
}
