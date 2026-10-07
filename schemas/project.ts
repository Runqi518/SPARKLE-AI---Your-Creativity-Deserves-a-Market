import { z } from "zod";

// Decode legacy persisted category keys without changing user-authored content.
const legacyIndustryCodes = [
  [25945, 32946, 22521, 35757],
  [51, 99, 21450, 30005, 22120],
  [32654, 22918],
  [27597, 23156],
  [23456, 29289],
  [20114, 32852, 32593],
];
const englishIndustries = ["Education and Training", "Electronics and Appliances", "Beauty", "Maternity and Baby", "Pets", "Internet"] as const;
export function normalizeProjectIndustry(value: unknown): unknown {
  const index = legacyIndustryCodes.findIndex(codes => String.fromCodePoint(...codes) === value);
  return index < 0 ? value : englishIndustries[index];
}

export const ProjectIndustrySchema = z.preprocess(normalizeProjectIndustry, z.enum([
  "Education and Training",
  "Electronics and Appliances",
  "Beauty",
  "Maternity and Baby",
  "Pets",
  "Internet",
]));

export const CreationModeSchema = z.enum(["template", "basic", "free"]);
export const BasicCreationTypeSchema = z.enum(["t2v", "i2v", "edit"]);

export const CanvasNodeSchema = z.object({
  id: z.string().min(1).max(160),
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
  name: z.string().min(1, "Project name is required").max(50, "Project name is too long").default("Untitled project"),
  industry: ProjectIndustrySchema.default("Internet"),
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
  nodes: z.array(CanvasNodeSchema).max(200),
  edges: z.array(CanvasEdgeSchema).max(1000),
}).superRefine((canvas, ctx) => {
  const ids = new Set(canvas.nodes.map(node => node.id));
  if (ids.size !== canvas.nodes.length) ctx.addIssue({ code: "custom", message: "Node IDs must be unique.", path: ["nodes"] });
  if (new Set(canvas.edges.map(edge => edge.id)).size !== canvas.edges.length) ctx.addIssue({ code: "custom", message: "Edge IDs must be unique.", path: ["edges"] });
  const outgoing = new Map<string, string[]>();
  for (const edge of canvas.edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) ctx.addIssue({ code: "custom", message: "Connections must refer to existing nodes.", path: ["edges"] });
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]);
  }
  const visited = new Set<string>(), stack = new Set<string>();
  function visit(id: string): boolean {
    if (stack.has(id)) return false;
    if (visited.has(id)) return true;
    stack.add(id);
    for (const target of outgoing.get(id) || []) if (!visit(target)) return false;
    stack.delete(id); visited.add(id); return true;
  }
  if ([...ids].some(id => !visit(id))) ctx.addIssue({ code: "custom", message: "Connections must not form a cycle.", path: ["edges"] });
});
export const SaveCanvasSchema = z.object({ nodes: z.array(CanvasNodeSchema).max(200), edges: z.array(CanvasEdgeSchema).max(1000), revision: z.number().int().nonnegative().optional() });
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
  revision: z.number().int().nonnegative().optional(),
});

export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
