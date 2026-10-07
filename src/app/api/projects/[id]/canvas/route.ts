import { api } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SaveCanvasSchema } from "../../../../../../schemas/project";
import { readInput, StudioError } from "@/lib/studio/http";
import { getProject, saveCanvas } from "@/lib/projects";

async function GETHandler(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  return NextResponse.json({ canvas: project.canvas, revision: project.revision, updatedAt: project.updatedAt });
}

async function PUTHandler(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = SaveCanvasSchema.safeParse(await readInput(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { id } = await params;
  if (parsed.data.revision === undefined && Number((await getProject(id))?.revision || 0) > 0) throw new StudioError("A canvas revision is required to prevent overwriting newer edits.", 409);
  const project = await saveCanvas(id, parsed.data, parsed.data.revision ?? 0);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  return NextResponse.json({ project });
}

export const GET = api(GETHandler);
export const PUT = api(PUTHandler);
