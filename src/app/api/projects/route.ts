import { api } from "@/lib/auth";
import { NextResponse } from "next/server";
import { CreateProjectSchema } from "../../../../schemas/project";
import { createProject, getProjects } from "@/lib/projects";
import { readInput } from "@/lib/studio/http";

async function GETHandler() {
  const projects = await getProjects();
  return NextResponse.json({ projects, limit: 10 });
}

async function POSTHandler(request: Request) {
  const parsed = CreateProjectSchema.safeParse(await readInput(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    const project = await createProject(parsed.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "无法创建项目" }, { status: 409 });
  }
}

export const GET = api(GETHandler);
export const POST = api(POSTHandler);
