import { constants } from "node:fs";
import { mkdir, open, realpath, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { LibraryAsset, prepareLibrary, MarketTemplate } from "./library";
import { currentActor } from "./actor";
import { Op } from "sequelize";
import { StudioError } from "./studio/http";
import sharp from "sharp";

export const mediaRoot = () => path.resolve(process.env.SPARKLE_MEDIA_PATH || path.join(process.cwd(), "data", "uploads"));
const formats: Record<string, { ext: string; kind: string; valid: (bytes: Buffer) => boolean }> = {
  "image/png": { ext: "png", kind: "image", valid: b => b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  "image/jpeg": { ext: "jpg", kind: "image", valid: b => b[0] === 255 && b[1] === 216 && b[2] === 255 },
  "image/webp": { ext: "webp", kind: "image", valid: b => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  "image/gif": { ext: "gif", kind: "image", valid: b => /^GIF8[79]a/.test(b.toString("ascii", 0, 6)) },
  "video/mp4": { ext: "mp4", kind: "video", valid: b => b.toString("ascii", 4, 8) === "ftyp" },
  "video/webm": { ext: "webm", kind: "video", valid: b => b.subarray(0, 4).equals(Buffer.from([26,69,223,163])) },
  "audio/mpeg": { ext: "mp3", kind: "audio", valid: b => b.toString("ascii", 0, 3) === "ID3" || (b[0] === 255 && (b[1] & 224) === 224) },
  "audio/wav": { ext: "wav", kind: "audio", valid: b => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WAVE" },
  "audio/ogg": { ext: "ogg", kind: "audio", valid: b => b.toString("ascii", 0, 4) === "OggS" },
};
export async function storeMedia(name: string, mime: string, bytes: Buffer, maximum = 20 * 1024 * 1024) {
  if (!bytes.length || bytes.length > maximum) throw new StudioError("Choose a file smaller than 20 MB.", 413);
  const format = formats[mime === "audio/x-wav" ? "audio/wav" : mime];
  if (!format || !format.valid(bytes)) throw new StudioError("File contents do not match a supported media format.", 415);
  if (format.kind === "image") {
    try { await sharp(bytes, { limitInputPixels: 40000000 }).resize(1, 1).png().toBuffer(); }
    catch { throw new StudioError("This image is damaged or exceeds the supported image dimensions.", 415); }
  }
  await prepareLibrary();
  const id = randomUUID(), filename = `${id}.${format.ext}`;
  await mkdir(mediaRoot(), { recursive: true });
  await writeFile(path.join(mediaRoot(), filename), bytes, { flag: "wx" });
  const asset = { id, name: name.slice(0, 120), kind: format.kind, url: `/uploads/${filename}` };
  try { await LibraryAsset.create({ ...asset, bytes: bytes.length }); }
  catch (error) { await rm(path.join(mediaRoot(), filename), { force: true }); throw error; }
  return asset;
}
export async function authorizeMedia(url: string) {
  await prepareLibrary();
  const own = await LibraryAsset.findOne({ where: { url } });
  if (own) return;
  const { Commission, prepareCommissions } = await import("./commissions");
  await prepareCommissions();
  if (await Commission.findOne({ ...{ hooks: false }, where: { buyerId: currentActor().id, deliveryUrl: url, status: ["submitted", "accepted", "changes_requested"] } })) return;
  if (process.env.SPARKLE_PAYMENT_BASE_URL) {
    const { TemplateEntitlement, preparePayments } = await import("./payments"); await preparePayments();
    for (const item of await TemplateEntitlement.findAll()) if (JSON.stringify(item.get("snapshot")).includes(JSON.stringify(url))) return;
  }
  // Published template files remain readable when the author removes a library entry.
  const templates = await MarketTemplate.findAll({ ...{ hooks: false }, where: { [Op.or]: [{ ownerId: currentActor().id }, { published: true }] } });
  for (const template of templates) {
    const snapshot = template.get("snapshot") as { image: string };
    if (snapshot.image === url) return;
    if (template.get("ownerId") === currentActor().id && JSON.stringify(snapshot).includes(JSON.stringify(url))) return;
    if (process.env.SPARKLE_PAYMENT_BASE_URL) {
      const { TemplateEntitlement } = await import("./payments");
      if (await TemplateEntitlement.findOne({ where: { templateId: template.get("id") } }) && JSON.stringify(snapshot).includes(JSON.stringify(url))) return;
    } else if (template.get("published") && JSON.stringify(snapshot).includes(JSON.stringify(url))) return;
  }
  if (process.env.SPARKLE_AUTH_MODE !== "accounts" && currentActor().id === "local-workspace") return;
  throw new StudioError("Media not found.", 404);
}
export async function localMediaPath(url: string, signedAccess = false) {
  if (!/^\/uploads\/[A-Za-z0-9_-]+\.[a-z0-9]+$/i.test(url)) throw new StudioError("Invalid local media path.");
  if (!signedAccess) await authorizeMedia(url);
  for (const directory of [mediaRoot(), path.join(process.cwd(), "public", "uploads")]) {
    const file = path.join(directory, path.basename(url));
    try {
      const resolved = await realpath(file);
      if (resolved !== file) throw new StudioError("Symlink media is not supported.");
      const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
      try { if (!(await handle.stat()).isFile()) throw new Error(); } finally { await handle.close(); }
      return file;
    } catch (error) { if (error instanceof StudioError) throw error; }
  }
  throw new StudioError("Media file is missing.", 404);
}
export const mediaMime = (filename: string) => Object.entries(formats).find(([, value]) => filename.endsWith(`.${value.ext}`))?.[0] || "application/octet-stream";

async function signingKey() {
  const configured = process.env.SPARKLE_MEDIA_SIGNING_KEY;
  if (configured) { if (configured.length < 32) throw new StudioError("Media signing key must contain at least 32 characters.", 503); return configured; }
  const file = path.join(path.dirname(mediaRoot()), "media-signing.key");
  await mkdir(path.dirname(file), { recursive: true });
  try { return await readFile(file, "utf8"); } catch {
    try { await writeFile(file, randomBytes(32).toString("hex"), { mode: 0o600, flag: "wx" }); } catch { /* Another process may have created the key first. */ }
    return readFile(file, "utf8");
  }
}
export async function signedMediaUrl(url: string, base: string) {
  const expires = String(Math.floor(Date.now()/1000) + 3600);
  const signature = createHmac("sha256", await signingKey()).update(`${url}:${expires}`).digest("hex");
  return `${base.replace(/\/$/, "")}${url}?expires=${expires}&signature=${signature}`;
}
export async function verifyMediaSignature(url: URL) {
  const expires = url.searchParams.get("expires"), signature = url.searchParams.get("signature");
  if (!expires || !signature || !/^\d{10}$/.test(expires) || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const ttl = Number(expires) - Date.now()/1000;
  if (ttl < 0 || ttl > 3700) return false;
  const expected = createHmac("sha256", await signingKey()).update(`${url.pathname}:${expires}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
