import { randomUUID } from "node:crypto";
import type { GenerationCandidate, StudioGenerationOptions } from "../../../schemas/studio-generation";
import { dot, redact, render, requireProvider, type ProviderConfig } from "./config";
import { boundedJson, StudioError } from "./http";
import { resolveReference, safeOutputUrl, storePng } from "./assets";
import { reserveProviderCall } from "./usage";
import { archiveOutput } from "../remote-media";

export type ProviderResult = { candidates: GenerationCandidate[]; providerJobId?: string; warning?: string };
export type GenerationInput = { prompt: string; images: string[]; videos: string[]; options: StudioGenerationOptions; rolePrompt?: string };

async function requestJson(config: ProviderConfig, url: string, method: string, payload?: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(url, {
      method, signal: controller.signal, redirect: "error", cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json", [config.authHeader]: [config.authScheme, config.key].filter(Boolean).join(" ") },
      ...(method === "GET" ? {} : { body: JSON.stringify(payload) }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new StudioError(`Provider returned HTTP ${response.status}. Check configuration and model access; no submission was retried.`, 502);
    }
    return await boundedJson(response.body, config.maxResponseBytes, 502);
  } catch (error) {
    if (error instanceof StudioError) throw error;
    throw new StudioError(controller.signal.aborted
      ? "Provider request timed out. It may still be billed; no automatic submission retry was made."
      : "Provider connection failed. It may still be billed; no automatic submission retry was made.", 502);
  } finally { clearTimeout(timer); }
}

async function decode(config: ProviderConfig, raw: unknown, count: number, polling: boolean): Promise<ProviderResult> {
  const output = dot(raw, polling ? config.pollOutputPath : config.outputPath);
  const candidate = (value: { content?: string; url?: string }): GenerationCandidate => ({ id: randomUUID(), kind: config.kind, ...value });
  if (config.kind === "text") {
    const values = (Array.isArray(output) ? output : [output]).map(value => typeof value === "string" ? value : dot(value, "message.content"));
    if (!values.length || values.some(value => typeof value !== "string" || !value.trim() || value.length > 100000)) throw new StudioError("Provider returned no valid text output.", 502);
    return { candidates: values.slice(0, count).map(value => candidate({ content: redact(value as string) })) };
  }
  if (config.kind === "image") {
    const values = Array.isArray(output) ? output : [output];
    if (!values.length || values.length > 64) throw new StudioError("Provider returned no valid image output.", 502);
    const candidates: GenerationCandidate[] = [];
    let warning: string | undefined;
    for (const value of values.slice(0, count)) {
      const url = typeof value === "string" ? value : dot(value, config.urlPath);
      if (url) { const stored = await archiveOutput(safeOutputUrl(url), "image"); candidates.push(candidate({ url: stored.url })); warning ||= stored.warning; }
      else candidates.push(candidate({ url: await storePng(dot(value, config.b64Path)) }));
    }
    return { candidates, ...(warning ? { warning } : {}) };
  }
  const status = String(dot(raw, config.statusPath) ?? "").toLowerCase();
  if (config.failure.includes(status)) throw new StudioError("Video provider reported generation failure.", 502);
  if (output && (!status || config.success.includes(status))) {
    const values = Array.isArray(output) ? output : [output];
    if (!values.length || values.length > 64) throw new StudioError("Video provider returned no valid output URLs.", 502);
    const outputs = await Promise.all(values.slice(0,count).map(value => archiveOutput(safeOutputUrl(typeof value === "object" ? dot(value, config.urlPath) : value), "video")));
    return { candidates: outputs.map(value => candidate({ url: value.url })), ...(outputs.some(value => value.warning) ? { warning: outputs.find(value => value.warning)!.warning } : {}) };
  }
  if (config.success.includes(status)) throw new StudioError("Video provider reported success without a valid output URL.", 502);
  if (polling) return { candidates: [] };
  const id = dot(raw, config.jobIdPath);
  if ((typeof id !== "string" && typeof id !== "number") || !String(id).length || String(id).length > 512 || redact(String(id)) !== String(id)) throw new StudioError("Video provider returned neither output nor a valid job ID.", 502);
  return { candidates: [], providerJobId: String(id) };
}

export async function submitGeneration(config: ProviderConfig, input: GenerationInput): Promise<ProviderResult> {
  const images = await Promise.all(input.images.map(value => /^data:image\/jpeg;base64,/.test(value) && value.length < 4 * 1024 * 1024 ? value : resolveReference(value, "image")));
  const videos = await Promise.all(input.videos.map(value => resolveReference(value, "video")));
  const rolePrompt = input.rolePrompt || "You are Sparkle's creative production assistant. Use the supplied context to produce the requested output. Return usable content, not claims about modifying a canvas.";
  const messages = [{ role: "system", content: rolePrompt }, { role: "user", content: images.length || videos.length ? [
    { type: "text", text: input.prompt }, ...images.map(url => ({ type: "image_url", image_url: { url } })),
    ...videos.map(url => ({ type: "video_url", video_url: { url } })),
  ] : input.prompt }];
  const { count, aspectRatio, resolution, duration } = input.options;
  const side = resolution === "2K" ? 2048 : 1024;
  const [width, height] = aspectRatio.split(":").map(Number);
  const size = `${Math.round(side * width / Math.max(width, height))}x${Math.round(side * height / Math.max(width, height))}`;
  const values = { model: config.model, prompt: input.prompt, rolePrompt, messages, count, size, aspectRatio, resolution, duration, images, videos, image: images[0] ?? null, video: videos[0] ?? null };
  const payload = config.requestTemplate ? render(config.requestTemplate, values)
    : config.kind === "text" ? { model: config.model, messages, n: count }
    : config.kind === "image" ? { model: config.model, prompt: input.prompt, n: count, size, aspect_ratio: aspectRatio, resolution, ...(images.length ? { images, image: images[0] } : {}) }
    : { model: config.model, prompt: input.prompt, n: count, aspect_ratio: aspectRatio, resolution, duration, images, videos };
  await reserveProviderCall();
  return decode(config, await requestJson(config, config.endpoint, "POST", payload), count, false);
}

export async function pollVideo(config: ProviderConfig, providerJobId: string, count: number) {
  const url = config.pollEndpoint.replace(/\{\{jobId\}\}|%7B%7BjobId%7D%7D/gi, encodeURIComponent(providerJobId));
  const payload = config.pollTemplate ? render(config.pollTemplate, { jobId: providerJobId, model: config.model }) : { id: providerJobId };
  return decode(config, await requestJson(config, url, config.pollMethod, payload), count, true);
}

export async function generateText(prompt: string, rolePrompt: string, media: { images: string[]; videos: string[] } = { images: [], videos: [] }) {
  if (!prompt.trim() || prompt.length > 180000 || rolePrompt.length > 20000) throw new StudioError("Assistant prompt is empty or too long.");
  const result = await submitGeneration(requireProvider("text"), { prompt, rolePrompt, ...media, options: { count: 1, aspectRatio: "16:9", resolution: "1K", duration: 5 } });
  return result.candidates[0].content!;
}
