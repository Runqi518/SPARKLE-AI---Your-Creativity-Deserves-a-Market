import { z } from "zod";

// 节点类型枚举
export const NodeTypeSchema = z.enum(["image", "video", "text", "ai_generation"]);

// AI 生成请求体结构
export const GenerationRequestSchema = z.object({
  projectId: z.string().optional(),
  nodeId: z.string(),
  type: NodeTypeSchema,
  prompt: z.string().min(1, "Prompt 不能为空"),
  sourceNodeIds: z.array(z.string()).optional().default([]), // 链路传入的上游节点
  config: z.object({
    model: z.string().default("seedance2.0"),
    aspectRatio: z.string().default("16:9"),
    resolution: z.string().default("720p"),
  }).optional().default(() => ({ model: "seedance2.0", aspectRatio: "16:9", resolution: "720p" })),
});
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;

// AI 生成任务状态
export const TaskStatusSchema = z.enum(["pending", "processing", "success", "failed"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// AI 生成任务响应体
export const GenerationTaskSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  status: TaskStatusSchema,
  prompt: z.string(),
  resultUrl: z.string().optional(), // 生成成功的媒体地址
  errorMsg: z.string().optional(),
  createdAt: z.number(),
});
export type GenerationTask = z.infer<typeof GenerationTaskSchema>;
