import { constants } from "node:fs";
import { mkdir, open, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { httpUrl, redact } from "./config";
import { StudioError } from "./http";

const maxAssetBytes = 10 * 1024 * 1024;
const mime: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".svg": "image/svg+xml" };

export function validateReference(value: string, kind: "image" | "video") {
  if (/^https?:\/\//i.test(value)) {
    httpUrl(value);
    if (redact(value) !== value) throw new StudioError("Reference URL contains a provider credential.");
    return;
  }
  const demo = kind === "image" && ["/studio-product.svg", "/studio-object.svg"].includes(value);
  if (!demo && !/^\/uploads\/[A-Za-z0-9][A-Za-z0-9_-]*\.(png|jpg|jpeg|webp|gif|mp4|webm|mov)$/i.test(value)) {
    throw new StudioError("References must be HTTP(S) URLs or supported files directly inside /uploads/.");
  }
  if (!mime[path.extname(value).toLowerCase()]?.startsWith(`${kind}/`)) throw new StudioError("Reference media type does not match its node kind.");
}

export async function resolveReference(value: string, kind: "image" | "video") {
  validateReference(value, kind);
  if (/^https?:\/\//i.test(value)) return value; // Provider fetches it; never download arbitrary remote URLs here.
  const root = await realpath(path.join(process.cwd(), "public"));
  const file = path.join(root, value);
  let handle;
  try {
    const resolved = await realpath(file);
    if (resolved !== file || !resolved.startsWith(`${root}${path.sep}`)) throw new Error();
    handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size < 1) throw new Error();
    const publicUrl = process.env.SPARKLE_PUBLIC_URL?.trim();
    if (publicUrl) {
      const base = httpUrl(publicUrl);
      if (base.search || base.hash) throw new StudioError("SPARKLE_PUBLIC_URL must not contain a query or fragment.", 503);
      return `${base.toString().replace(/\/$/, "")}${value}`;
    }
    if (stat.size > maxAssetBytes) throw new StudioError("Local reference exceeds 10 MiB. Configure SPARKLE_PUBLIC_URL for large uploads.");
    const bytes = await handle.readFile();
    if (bytes.length > maxAssetBytes) throw new StudioError("Local reference exceeds 10 MiB.");
    return `data:${mime[path.extname(value).toLowerCase()]};base64,${bytes.toString("base64")}`;
  } catch (error) {
    if (error instanceof StudioError) throw error;
    throw new StudioError("Local reference is missing, unreadable or not a regular non-symlink upload.");
  } finally { await handle?.close(); }
}

export function safeOutputUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 20000 || redact(value) !== value) throw new StudioError("Provider returned an invalid media URL.", 502);
  try { httpUrl(value); } catch { throw new StudioError("Provider returned an invalid media URL.", 502); }
  return value;
}

export async function storePng(value: unknown) {
  if (typeof value !== "string" || value.length > Math.ceil(maxAssetBytes / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new StudioError("Provider returned invalid or oversized base64 PNG data.", 502);
  const bytes = Buffer.from(value, "base64");
  if (bytes.toString("base64") !== value || bytes.length > maxAssetBytes || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new StudioError("Provider image is not a supported PNG.", 502);
  let offset = 8;
  let header = false;
  let data = false;
  let ended = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (offset + length + 12 > bytes.length) break;
    if (!header) {
      if (type !== "IHDR" || length !== 13) break;
      const width = bytes.readUInt32BE(offset + 8), height = bytes.readUInt32BE(offset + 12);
      if (!width || !height || width > 16384 || height > 16384 || width * height > 40000000) break;
      header = true;
    }
    if (type === "IDAT" && length > 0) data = true;
    offset += length + 12;
    if (type === "IEND") { ended = length === 0 && offset === bytes.length; break; }
  }
  if (!header || !data || !ended) throw new StudioError("Provider PNG structure or dimensions are invalid.", 502);
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  // Reject symlinked upload directories before writing generated media.
  if (await realpath(directory) !== directory) throw new StudioError("Upload directory must not be a symlink.", 500);
  const name = `generated-${randomUUID()}.png`;
  await writeFile(path.join(directory, name), bytes, { flag: "wx", mode: 0o600 });
  return `/uploads/${name}`;
}
