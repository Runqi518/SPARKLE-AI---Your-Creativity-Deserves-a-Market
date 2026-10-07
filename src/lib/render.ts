import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { DataTypes } from "sequelize";
import { z } from "zod";
import { sequelize, syncDatabase } from "./db";
import { withActor } from "./actor";
import { getProject } from "./projects";
import { LibraryAsset, prepareLibrary } from "./library";
import { localMediaPath, mediaRoot } from "./media";
import { StudioError } from "./studio/http";
import { CanvasSnapshotSchema } from "../../schemas/project";
const execute = promisify(execFile);
export const RenderJob = sequelize.models.RenderJob || sequelize.define("RenderJob", {
  id: { type: DataTypes.STRING, primaryKey: true }, requestId: { type: DataTypes.STRING, unique: true, allowNull: false },
  projectId: { type: DataTypes.STRING, allowNull: false }, snapshot: DataTypes.JSON, options: DataTypes.JSON,
  status: { type: DataTypes.STRING, defaultValue: "queued" }, url: DataTypes.TEXT, error: DataTypes.TEXT,
  startedAt: DataTypes.DATE, deadline: DataTypes.DATE,
});
const schema = z.object({ requestId: z.uuid(), projectId: z.string().min(1).max(160), snapshot: CanvasSnapshotSchema,
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"), resolution: z.enum(["720p", "1080p"]).default("1080p") });
let ready: Promise<unknown> | undefined;
async function prepare() { ready ??= (async () => { await syncDatabase(); await RenderJob.sync(); })().catch(error => { ready = undefined; throw error; }); await ready; }
export async function createRender(raw: unknown) {
  const parsed = schema.safeParse(raw); if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  const input = parsed.data;
  if (input.projectId !== "demo" && !await getProject(input.projectId)) throw new StudioError("Project not found.", 404);
  const media = input.snapshot.nodes.filter(node => ["image", "video"].includes(String(node.data.kind)) && node.data.url);
  if (!media.length) throw new StudioError("Add an image or video to the timeline before exporting.");
  if (media.length > 30) throw new StudioError("Use no more than 30 visual clips in one export.");
  // Validate ownership and supported sources before creating background work.
  for (const node of input.snapshot.nodes) if (node.data.url && ["image", "video", "audio"].includes(String(node.data.kind))) await renderSource(String(node.data.url));
  try { await execute(process.env.SPARKLE_FFMPEG_PATH || "ffmpeg", ["-version"], { timeout: 5000, maxBuffer: 10000 }); } catch { throw new StudioError("FFmpeg is required on the server to export MP4.", 503); }
  await prepare();
  const previous = await RenderJob.findOne({ where: { requestId: input.requestId } });
  if (previous) {
    if (JSON.stringify(previous.get("snapshot")) !== JSON.stringify(input.snapshot) || previous.get("projectId") !== input.projectId || JSON.stringify(previous.get("options")) !== JSON.stringify({ aspectRatio: input.aspectRatio, resolution: input.resolution })) throw new StudioError("Export request ID already has different inputs.", 409);
    return publicRender(previous.toJSON());
  }
  return publicRender((await RenderJob.create({ id: randomUUID(), requestId: input.requestId, projectId: input.projectId, snapshot: input.snapshot, options: { aspectRatio: input.aspectRatio, resolution: input.resolution }, deadline: new Date(Date.now() + 15 * 60000) })).toJSON());
}
function publicRender(row: Record<string, unknown>) { return { id: row.id, projectId: row.projectId, status: row.status, url: row.url, error: row.error }; }
export async function getRender(id: string) { await prepare(); const row = await RenderJob.findByPk(id); if (!row) throw new StudioError("Export not found.", 404); return publicRender(row.toJSON()); }
async function renderSource(url: string) {
  if (url.startsWith("/uploads/")) return localMediaPath(url);
  if (/^\/template-campaigns\/[A-Za-z0-9_-]+\.(jpg|png|webp)$/.test(url) || /^\/studio-(product|object)\.svg$/.test(url)) return path.join(process.cwd(), "public", url);
  throw new StudioError("Import remote output into My assets before exporting. Only owned server files and bundled references can be rendered.");
}
function timing(data: Record<string, unknown>) {
  const start = Number(data.start || 0), duration = Number(data.duration || 5);
  if (!Number.isFinite(start) || !Number.isFinite(duration) || start < 0 || duration <= 0 || start + duration > 120) throw new StudioError("Export supports a timeline up to 120 seconds with positive clip durations.");
  return { start, duration };
}
export async function runRender(id: string) {
  await prepare();
  const [claimed] = await RenderJob.update({ status: "running", startedAt: new Date() }, { where: { id, status: "queued" } });
  if (!claimed) return;
  const model = await RenderJob.findByPk(id); if (!model) return;
  let temporary = "";
  let output = "";
  try {
    const snapshot = model.get("snapshot") as z.infer<typeof CanvasSnapshotSchema>;
    const options = model.get("options") as { aspectRatio: string; resolution: string };
    const side = options.resolution === "720p" ? 1280 : 1920;
    const [rw, rh] = options.aspectRatio.split(":").map(Number);
    const width = Math.round(side * rw / Math.max(rw, rh) / 2) * 2, height = Math.round(side * rh / Math.max(rw, rh) / 2) * 2;
    const nodes = snapshot.nodes.filter(node => ["image", "video", "audio"].includes(String(node.data.kind)) && node.data.url);
    const duration = Math.max(1, ...snapshot.nodes.map(node => { const time = timing(node.data); return time.start + time.duration; }));
    await mkdir(mediaRoot(), { recursive: true });
    temporary = await mkdtemp(path.join(mediaRoot(), ".render-"));
    const args = ["-v", "error", "-y", "-f", "lavfi", "-i", `color=c=white:s=${width}x${height}:r=30:d=${duration}`];
    const filters: string[] = [], audio: string[] = []; let visual = "0:v";
    for (const [index, node] of nodes.entries()) {
      const time = timing(node.data); let file = await renderSource(String(node.data.url)); const input = index + 1;
      if (node.data.kind === "image") {
        const raster = path.join(temporary, `${index}.png`);
        await sharp(await readFile(file)).resize(width, height, { fit: "contain", background: "white" }).png().toFile(raster);
        file = raster; args.push("-loop", "1", "-t", String(time.duration), "-i", file);
      } else args.push("-t", String(time.duration), "-i", file);
      let hasAudio = node.data.kind === "audio";
      if (node.data.kind === "video") {
        const probe = await execute(process.env.SPARKLE_FFPROBE_PATH || "ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=index", "-of", "csv=p=0", file], { timeout: 15000 });
        hasAudio = Boolean(probe.stdout.trim());
      }
      if (hasAudio) {
        const label = `audio${index}`;
        filters.push(`[${input}:a]atrim=duration=${time.duration},asetpts=PTS-STARTPTS,adelay=${Math.round(time.start * 1000)}:all=1[${label}]`); audio.push(`[${label}]`);
      }
      if (node.data.kind !== "audio") {
        const clip = `clip${index}`, next = `layer${index}`;
        filters.push(`[${input}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:white,setsar=1,trim=duration=${time.duration},setpts=PTS-STARTPTS+${time.start}/TB[${clip}]`);
        filters.push(`[${visual}][${clip}]overlay=eof_action=pass:enable='between(t,${time.start},${time.start + time.duration})'[${next}]`); visual = next;
      }
    }
    const captions = snapshot.nodes.filter(node => node.data.kind === "text" && node.data.track === "Captions" && node.data.content);
    if (captions.length) {
      const stamp = (seconds: number) => `${Math.floor(seconds / 3600)}:${String(Math.floor(seconds / 60) % 60).padStart(2,"0")}:${(seconds % 60).toFixed(2).padStart(5,"0")}`;
      const events = captions.map(node => { const time = timing(node.data); const text = String(node.data.content).replace(/[{}\\]/g, "").replace(/\r?\n/g,"\\N").slice(0, 6000); return `Dialogue: 0,${stamp(time.start)},${stamp(time.start + time.duration)},Default,,0,0,0,,${text}`; });
      const subtitle = path.join(temporary, "captions.ass");
      await writeFile(subtitle, `[Script Info]\nScriptType: v4.00+\nPlayResX: ${width}\nPlayResY: ${height}\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,${Math.round(height/24)},&H00FFFFFF,&H00FFFFFF,&H00111111,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,40,40,40,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${events.join("\n")}\n`);
      filters.push(`[${visual}]ass=filename='${subtitle.replace(/[':\\]/g,"\\$&")}'[captioned]`); visual = "captioned";
    }
    if (audio.length) filters.push(`${audio.join("")}amix=inputs=${audio.length}:duration=longest:normalize=0,alimiter=limit=0.95[mixed]`);
    const assetId = randomUUID(); output = path.join(mediaRoot(), `${assetId}.mp4`);
    args.push("-filter_complex", filters.join(";"), "-map", `[${visual}]`);
    if (audio.length) args.push("-map", "[mixed]", "-c:a", "aac", "-b:a", "192k");
    args.push("-t", String(duration), "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", output);
    await execute(process.env.SPARKLE_FFMPEG_PATH || "ffmpeg", args, { timeout: 10 * 60000, maxBuffer: 2 * 1024 * 1024 });
    await prepareLibrary();
    const url = `/uploads/${assetId}.mp4`;
    if (!await RenderJob.findByPk(id)) { await rm(output, { force: true }); return; }
    await LibraryAsset.create({ id: assetId, name: "Rendered advertisement.mp4", kind: "video", url });
    await RenderJob.update({ status: "succeeded", url }, { where: { id, status: "running" } });
  } catch (error) {
    if (output) await rm(output, { force: true });
    await RenderJob.update({ status: "failed", error: error instanceof StudioError ? error.message : "Video rendering failed. Check FFmpeg, media codecs and available disk space." }, { where: { id, status: "running" } });
  } finally { if (temporary) await rm(temporary, { recursive: true, force: true }); }
}
export async function recoverRenderQueue() {
  await prepare();
  const jobs = await RenderJob.findAll({ ...{ hooks: false }, where: { status: ["queued", "running"] }, limit: 20 });
  for (const row of jobs) await withActor({ id: String(row.get("ownerId")) }, async () => {
    if (new Date(String(row.get("deadline"))).getTime() <= Date.now()) await RenderJob.update({ status: "failed", error: "Export timed out or was interrupted." }, { where: { id: row.get("id") } });
    else if (row.get("status") === "queued") await runRender(String(row.get("id")));
  });
}
