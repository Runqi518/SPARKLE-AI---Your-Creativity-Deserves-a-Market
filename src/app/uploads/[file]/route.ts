import { open } from "node:fs/promises";
import { api } from "@/lib/auth";
import { localMediaPath, mediaMime, verifyMediaSignature } from "@/lib/media";
import { StudioError } from "@/lib/studio/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ file: string }> };
async function serve(request: Request, { params }: Context, signed = false) {
  const { file } = await params;
  const filename = await localMediaPath(`/uploads/${file}`, signed);
  const handle = await open(filename, "r");
  const { size } = await handle.stat();
  const range = request.headers.get("range");
  let start = 0, end = size - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) { await handle.close(); throw new StudioError("Unsupported range.", 416); }
    if (!match[1]) start = Math.max(0, size - Number(match[2]));
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (start > end || start >= size) { await handle.close(); return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } }); }
  }
  const headers: Record<string, string> = { "Content-Type": mediaMime(file), "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (range) headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  // Small bounded chunks support seekable video without buffering the full file.
  let position = start;
  const stream = new ReadableStream<Uint8Array>({ async pull(controller) {
    try {
      if (position > end) { await handle.close(); controller.close(); return; }
      const buffer = Buffer.alloc(Math.min(65536, end - position + 1));
      const result = await handle.read(buffer, 0, buffer.length, position);
      if (!result.bytesRead) { await handle.close(); controller.close(); return; }
      position += result.bytesRead; controller.enqueue(buffer.subarray(0, result.bytesRead));
    } catch (error) { await handle.close().catch(() => {}); controller.error(error); }
  }, async cancel() { await handle.close(); } });
  return new Response(stream, { status: range ? 206 : 200, headers });
}
const authenticated = api((request: Request, context: Context) => serve(request, context));
export async function GET(request: Request, context: Context) {
  if (await verifyMediaSignature(new URL(request.url))) return serve(request, context, true);
  return authenticated(request, context);
}
