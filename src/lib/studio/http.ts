export class StudioError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(error: unknown) {
  return Response.json(
    { error: error instanceof StudioError ? error.message : "Studio could not complete this request. No automatic submission retry was made." },
    { status: error instanceof StudioError ? error.status : 500, headers: { "Cache-Control": "no-store" } },
  );
}

export function jsonResponse(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

export async function boundedJson(body: ReadableStream<Uint8Array> | null, limit: number, status = 400): Promise<unknown> {
  if (!body) throw new StudioError("A JSON body is required.", status);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) {
        await reader.cancel();
        throw new StudioError("JSON body exceeds the size limit.", status === 400 ? 413 : status);
      }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new StudioError("Expected a valid JSON response or request.", status); }
  } finally { reader.releaseLock(); }
}

export async function readInput(request: Request) {
  // Local MVP has no accounts. Reject browser cross-origin paid submissions.
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new StudioError("Cross-origin submission is not allowed.", 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new StudioError("Content-Type must be application/json.", 415);
  }
  return boundedJson(request.body, 1024 * 1024);
}
