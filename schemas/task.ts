import { z } from "zod";

// Node type enum
export const NodeTypeSchema = z.enum(["image", "video", "text", "ai_generation"]);

// AI generation request schema
export const GenerationRequestSchema = z.object({
  projectId: z.string().optional(),
  nodeId: z.string(),
  type: NodeTypeSchema,
  prompt: z.string().min(1, "Prompt is required"),
  sourceNodeIds: z.array(z.string()).optional().default([]), // Upstream nodes supplied through connections
  config: z.object({
    model: z.string().default("seedance2.0"),
    aspectRatio: z.string().default("16:9"),
    resolution: z.string().default("720p"),
  }).optional().default(() => ({ model: "seedance2.0", aspectRatio: "16:9", resolution: "720p" })),
});
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;

// AI generation job status
export const TaskStatusSchema = z.enum(["pending", "processing", "success", "failed"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// AI generation response schema
export const GenerationTaskSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  status: TaskStatusSchema,
  prompt: z.string(),
  resultUrl: z.string().optional(), // URL of successfully generated media
  errorMsg: z.string().optional(),
  createdAt: z.number(),
});
export type GenerationTask = z.infer<typeof GenerationTaskSchema>;
