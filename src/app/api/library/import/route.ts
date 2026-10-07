import { z } from "zod";
import { api } from "@/lib/auth";
import { importRemoteMedia } from "@/lib/remote-media";
import { jsonResponse, readInput, StudioError } from "@/lib/studio/http";
export const POST = api(async (request: Request) => {
  const parsed = z.object({ url: z.string().url().max(20000),kind: z.enum(["image","video","audio"]),name: z.string().min(1).max(160).optional() }).strict().safeParse(await readInput(request));
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  return jsonResponse(await importRemoteMedia(parsed.data.url,parsed.data.kind,parsed.data.name),201);
});
