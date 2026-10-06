import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const types: Record<string, [string, string]> = {
  "image/jpeg": ["jpg", "image"],
  "image/png": ["png", "image"],
  "image/webp": ["webp", "image"],
  "image/gif": ["gif", "image"],
  "video/mp4": ["mp4", "video"],
  "video/webm": ["webm", "video"],
  "audio/mpeg": ["mp3", "audio"],
  "audio/wav": ["wav", "audio"],
  "audio/x-wav": ["wav", "audio"],
  "audio/ogg": ["ogg", "audio"],
};

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 21 * 1024 * 1024)
      return NextResponse.json(
        { error: "Choose a file smaller than 20 MB." },
        { status: 413 },
      );
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size)
      return NextResponse.json(
        { error: "Choose a media file." },
        { status: 400 },
      );
    if (file.size > 20 * 1024 * 1024)
      return NextResponse.json(
        { error: "Choose a file smaller than 20 MB." },
        { status: 413 },
      );
    const format = types[file.type];
    if (!format)
      return NextResponse.json(
        {
          error: "Use a JPG, PNG, WebP, GIF, MP4, WebM, MP3, WAV or OGG file.",
        },
        { status: 415 },
      );
    const id = randomUUID();
    const filename = `${id}.${format[0]}`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, filename),
      Buffer.from(await file.arrayBuffer()),
    );
    return NextResponse.json(
      {
        id,
        name: file.name.slice(0, 120),
        kind: format[1],
        url: `/uploads/${filename}`,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "The file could not be uploaded. Try again." },
      { status: 500 },
    );
  }
}
