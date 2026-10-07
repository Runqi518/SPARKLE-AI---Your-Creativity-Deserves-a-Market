import { api } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getProject, deleteProject, renameProject } from "@/lib/projects";
import { RenameProjectSchema } from "../../../../../schemas/project";
import { readInput } from "@/lib/studio/http";

async function GETHandler(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ project });
}

async function DELETEHandler(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteProject(id);
  return NextResponse.json({ success: true });
}

async function PATCHHandler(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = RenameProjectSchema.safeParse(await readInput(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { id } = await params;
  const project = await renameProject(id, parsed.data.name);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json({ project });
}

export const GET = api(GETHandler);
export const DELETE = api(DELETEHandler);
export const PATCH = api(PATCHHandler);
