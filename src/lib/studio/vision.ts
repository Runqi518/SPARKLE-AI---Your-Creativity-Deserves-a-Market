import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { assistantSource, type AssistantInput } from "./assistant-input";
import { localMediaPath } from "../media";
import { validateReference } from "./assets";
import { StudioError } from "./http";
const execute = promisify(execFile);

export async function assistantMedia(input: AssistantInput) {
  const source = JSON.parse(assistantSource(input)) as { references: { kind: string; url?: string }[] };
  const images: string[] = [], videos: string[] = [];
  for (const reference of source.references) {
    if (!reference.url) continue;
    if (reference.kind === "image") { validateReference(reference.url, "image"); images.push(reference.url); }
    if (reference.kind === "video") {
      validateReference(reference.url, "video");
      if (!reference.url.startsWith("/uploads/")) {
        if (process.env.SPARKLE_TEXT_VIDEO_MODE !== "native") throw new StudioError("Upload the reference video for frame analysis, or configure a provider supporting native video input.");
        videos.push(reference.url); continue;
      }
      const file = await localMediaPath(reference.url);
      for (const seconds of [0, 2, 5]) {
        try {
          const { stdout } = await execute(process.env.SPARKLE_FFMPEG_PATH || "ffmpeg", ["-v", "error", "-ss", String(seconds), "-i", file, "-frames:v", "1", "-vf", "scale=640:-2", "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"], { encoding: "buffer", timeout: 15000, maxBuffer: 3 * 1024 * 1024 });
          if (stdout.length) images.push(`data:image/jpeg;base64,${stdout.toString("base64")}`);
        } catch { throw new StudioError("Reference video frame extraction failed. Check the file and FFmpeg installation.", 503); }
      }
    }
  }
  return { images: [...new Set(images)].slice(0, 32), videos: [...new Set(videos)] };
}
