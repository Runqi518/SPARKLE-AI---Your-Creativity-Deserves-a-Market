import { NextResponse } from "next/server";
import { GenerationRequestSchema } from "../../../../../schemas/task";
import { createGenerationTask } from "@/lib/generation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Zod 参数校验
    const parsed = GenerationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const task = await createGenerationTask(parsed.data);

    return NextResponse.json({ task }, { status: 200 });
  } catch (err: any) {
    console.error("[generate] 500 error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
