import { z } from "zod";
import { CanvasSnapshotSchema } from "./project";

export const GenerationKindSchema = z.enum(["text", "image", "video"]);
export type GenerationKind = z.infer<typeof GenerationKindSchema>;
export const StudioGenerationOptionsSchema = z.object({
  model: z.string().max(160).optional(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).default("16:9"),
  resolution: z.enum(["720p", "1080p", "1K", "2K"]).default("1K"),
  duration: z.number().int().min(1).max(60).default(5),
  count: z.number().int().min(1).max(4).default(1),
});
export type StudioGenerationOptions = z.infer<typeof StudioGenerationOptionsSchema>;
export const StudioGenerationRequestSchema = z.object({
  requestId: z.string().uuid(),
  projectId: z.string().min(1).max(160),
  nodeId: z.string().min(1).max(160),
  snapshot: CanvasSnapshotSchema,
  options: StudioGenerationOptionsSchema,
  mediaSkillId: z.enum(["image-generation", "video-generation"]).optional(),
});
export type StudioGenerationRequest = z.infer<typeof StudioGenerationRequestSchema>;
export type GenerationCandidate = { id: string; kind: GenerationKind; content?: string; url?: string };
export type StudioJob = {
  id: string;
  projectId: string;
  nodeId: string;
  kind: GenerationKind;
  status: "queued" | "running" | "succeeded" | "failed";
  candidates: GenerationCandidate[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};
export type ProviderSummary = { kind: GenerationKind; configured: boolean; models: string[]; defaultModel: string };
