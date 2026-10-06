import { z } from "zod";

export const ProjectIndustrySchema = z.enum([
  "教育培训",
  "3c及电器",
  "美妆",
  "母婴",
  "宠物",
  "互联网",
]);

export const CreationModeSchema = z.enum(["template", "basic", "free"]);
export const BasicCreationTypeSchema = z.enum(["t2v", "i2v", "edit"]);

export const CanvasNodeSchema = z.object({
  id: z.string(),
  type: z.string().default("custom"),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.string(), z.unknown()),
});

export const CanvasEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  type: z.string().optional(),
  animated: z.boolean().optional(),
  style: z.record(z.string(), z.unknown()).optional(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "项目名称不能为空").max(50, "项目名称过长").default("未命名项目"),
  industry: ProjectIndustrySchema.default("互联网"),
  mode: CreationModeSchema,
  basicType: BasicCreationTypeSchema.optional(),
  templateId: z.number().int().positive().optional(),
  subjectId: z.string().min(1).optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const RenameProjectSchema = z.object({
  name: z.string().trim().min(1, "Enter a canvas name.").max(50, "Use 50 characters or fewer."),
});

export const CanvasSnapshotSchema = z.object({
  nodes: z.array(CanvasNodeSchema),
  edges: z.array(CanvasEdgeSchema),
});
export type CanvasSnapshot = z.infer<typeof CanvasSnapshotSchema>;

export const ProjectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: ProjectIndustrySchema,
  nodesCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  mode: CreationModeSchema,
  basicType: BasicCreationTypeSchema.optional(),
  subjectId: z.string().nullable().optional(),
  canvas: CanvasSnapshotSchema,
});

export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
