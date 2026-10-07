import { applyPaymentEvent } from "@/lib/payments";
import { errorResponse, jsonResponse, StudioError } from "@/lib/studio/http";
export async function POST(request: Request) {
  try {
    const reader = request.body?.getReader(); if (!reader) throw new StudioError("Payment event required.");
    const chunks: Uint8Array[] = []; let size = 0;
    try { for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 100000) { await reader.cancel(); throw new StudioError("Payment event too large.", 413); } chunks.push(value); } } finally { reader.releaseLock(); }
    return jsonResponse(await applyPaymentEvent(Buffer.concat(chunks).toString("utf8"), request.headers.get("x-sparkle-timestamp"), request.headers.get("x-sparkle-signature")));
  } catch (error) { return errorResponse(error); }
}
