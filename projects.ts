import {
  CanvasSnapshot,
  CreateProjectInput,
  ProjectResponse,
} from "../../schemas/project";
import { Project, Canvas, GenerationJob, Subject, sequelize, syncDatabase } from "./db";

const MAX_PROJECTS = 10;

function baseNode(id: string, label: string, nodeKind: string, x: number, y: number): {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
} {
  return {
    id,
    type: "custom",
    position: { x, y },
    data: { label, type: nodeKind, nodeKind },
  };
}

function initialCanvas(input: CreateProjectInput): CanvasSnapshot {
  if (input.mode === "free") return { nodes: [], edges: [] };

  if (input.mode === "template") {
    return {
      nodes: [
        baseNode("asset", "商品主图", "image", 100, 220),
        baseNode("video", "AI 种草视频", "video", 440, 220),
      ],
      edges: [{ id: "asset-video", source: "asset", target: "video", animated: true }],
    };
  }

  const isImageToVideo = input.basicType === "i2v";
  const isEdit = input.basicType === "edit";
  const source = baseNode(
    "source",
    isImageToVideo ? "步骤 1 · 上传参考图" : isEdit ? "步骤 1 · 导入视频" : "步骤 1 · 编写脚本",
    isImageToVideo ? "image" : isEdit ? "video" : "text",
    100,
    220,
  );
  const output = baseNode(
    "generation",
    isEdit ? "步骤 2 · 编辑视频" : "步骤 2 · 生成视频",
    "video",
    440,
    220,
  );
  output.data = {
    ...output.data,
    config: { aspectRatio: "16:9", resolution: "720p", duration: "1s-10s", candidates: 1 },
    inputMode: isImageToVideo ? "image-to-video" : isEdit ? "video-edit" : "text-to-video",
  };
  return { nodes: [source, output], edges: [{ id: "source-generation", source: "source", target: "generation", animated: true }] };
}

export async function createProject(input: CreateProjectInput): Promise<ProjectResponse> {
  await syncDatabase();
  const count = await Project.count();
  if (count >= MAX_PROJECTS) throw new Error(`项目数量已达上限（${MAX_PROJECTS} 个）`);
  if (input.subjectId && !await Subject.findByPk(input.subjectId)) throw new Error("Brand subject not found.");
  
  const id = `project_${Date.now()}`;
  const canvasData = initialCanvas(input);
  
  const project = await Project.create({
    id,
    name: input.name,
    industry: input.industry,
    mode: input.mode,
    basicType: input.basicType || null,
    subjectId: input.subjectId || null,
    nodesCount: canvasData.nodes.length,
  });

  await Canvas.create({
    projectId: id,
    nodes: canvasData.nodes,
    edges: canvasData.edges,
  });

  return {
    ...project.toJSON(),
    canvas: canvasData,
  } as ProjectResponse;
}

export async function getProject(id: string): Promise<ProjectResponse | null> {
  await syncDatabase();
  const project = await Project.findByPk(id, { include: Canvas });
  if (!project) return null;
  const data = project.toJSON() as any;
  return {
    ...data,
    canvas: data.Canvas ? { nodes: data.Canvas.nodes, edges: data.Canvas.edges } : { nodes: [], edges: [] },
  };
}

export async function getProjects(): Promise<ProjectResponse[]> {
  await syncDatabase();
  const projects = await Project.findAll({ order: [['createdAt', 'DESC']] });
  return projects.map(p => p.toJSON()) as ProjectResponse[];
}

export async function renameProject(id: string, name: string) {
  await syncDatabase();
  const project = await Project.findByPk(id);
  if (!project) return null;
  await project.update({ name });
  return { id, name: project.get("name") as string };
}

export async function deleteProject(id: string) {
  await syncDatabase();
  // Existing SQLite databases predate the cascade constraints in the model.
  await sequelize.transaction(async transaction => {
    await GenerationJob.destroy({ where: { projectId: id }, transaction });
    await Canvas.destroy({ where: { projectId: id }, transaction });
    await Project.destroy({ where: { id }, transaction });
  });
}

export async function saveCanvas(id: string, canvas: CanvasSnapshot) {
  await syncDatabase();
  const project = await Project.findByPk(id);
  if (!project) return null;
  
  await Canvas.update({
    nodes: canvas.nodes,
    edges: canvas.edges,
  }, { where: { projectId: id } });
  
  await project.update({ nodesCount: canvas.nodes.length });
  
  return getProject(id);
}

export async function updateNodeResult(id: string, nodeId: string, resultUrl: string) {
  const project = await getProject(id);
  if (!project) return;
  const canvas = {
    ...project.canvas,
    nodes: project.canvas.nodes.map((node) => node.id === nodeId
      ? { ...node, data: { ...node.data, resultUrl, status: "success" } }
      : node),
  };
  await saveCanvas(id, canvas);
}
