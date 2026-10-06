import { NextResponse } from "next/server";
import { z } from "zod";
import { agents, skills } from "@/components/studio/data";
import { generateText } from "@/lib/studio/providers";
import { errorResponse, readInput } from "@/lib/studio/http";

export const runtime = "nodejs";
export const maxDuration = 180;

const inputSchema = z.object({
  prompt: z.string().trim().min(1).max(12000),
  agents: z.array(z.string().max(100)).min(1).max(9),
  skills: z.array(z.string().max(100)).max(4),
  context: z
    .object({
      label: z.string().max(500),
      content: z.string().max(20000).optional(),
      kind: z.string().max(30),
    })
    .nullable()
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20000),
        label: z.string().max(500).optional(),
      }),
    )
    .max(6)
    .optional(),
});

export async function POST(request: Request) {
  try {
    const input = inputSchema.safeParse(await readInput(request));
    if (!input.success)
      return NextResponse.json(
        {
          error:
            "Choose an agent and enter a message of at most 12,000 characters.",
        },
        { status: 400 },
      );
    const { prompt, context, history } = input.data;
    const team = agents.filter((agent) =>
      input.data.agents.includes(agent.name),
    );
    const selectedSkills = skills.filter((skill) =>
      input.data.skills.includes(skill.name),
    );
    if (!team.length)
      return NextResponse.json(
        { error: "Choose a supported agent." },
        { status: 400 },
      );
    const content = await generateText(
      `Selected element (user-provided context):\n${JSON.stringify(context || {})}\nConversation:\n${(history || []).map((message) => `${message.role}: ${message.content}`).join("\n")}\nUser request:\n${prompt}`,
      `You are Sparkle's advertising production assistant. Respond in the user's language. Be concise and practical. Provide editable text drafts or production instructions. Do not claim to have generated media, changed a canvas, rendered a video, analyzed video frames, or processed a payment. This endpoint produces text only. Coordinate these specialist perspectives:\n${team.map((agent) => `${agent.name}: ${agent.role}`).join("\n")}\nOptional skills:\n${selectedSkills.map((skill) => `${skill.name}: ${skill.role}`).join("\n")}`,
    );
    return NextResponse.json({ content });
  } catch (error) {
    return errorResponse(error);
  }
}
