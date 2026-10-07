import { constants } from "node:fs";
import { mkdir, readdir, lstat, copyFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { syncDatabase, sequelize } from "./db";
import "./auth";
import { LibraryAsset } from "./library";
import "./studio/jobs";
import "./studio/agent-runs";
import "./studio/skill-runs";
import "./studio/usage";
import "./render";
import "./payments";
import "./commissions";
import "./workspace";
import { mediaRoot } from "./media";
import { LOCAL_OWNER, withActor } from "./actor";

const runtime = globalThis as typeof globalThis & { sparkleStartup?: Promise<void> };
export function initializeBackend() {
  runtime.sparkleStartup ??= (async () => {
    await mkdir(path.dirname(process.env.SPARKLE_DATABASE_PATH || path.join(process.cwd(), "database.sqlite")), { recursive: true });
    await mkdir(mediaRoot(), { recursive: true });
    await syncDatabase();
    // Models registered by this startup module must be ready even after hot reload.
    await sequelize.sync();
    const legacy = path.join(process.cwd(), "public", "uploads");
    const names = await readdir(legacy).catch(error => { if (error.code === "ENOENT") return []; throw error; });
    for (const name of names) {
      if (!/^[A-Za-z0-9_-]+\.(png|jpg|jpeg|webp|gif|mp4|webm|mp3|wav|ogg)$/i.test(name)) continue;
      const source = path.join(legacy, name), destination = path.join(mediaRoot(), name);
      const stat = await lstat(source); if (!stat.isFile() || stat.isSymbolicLink()) continue;
      try { await copyFile(source, destination, constants.COPYFILE_EXCL); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
      if (!(await readFile(source)).equals(await readFile(destination))) throw new Error("Legacy media destination differs; source preserved.");
      const extension = name.split(".").pop()!.toLowerCase();
      await withActor({ id: LOCAL_OWNER }, async () => {
        const url = `/uploads/${name}`;
        if (!await LibraryAsset.findOne({ where: { url } })) await LibraryAsset.create({ id: name.replace(/\.[^.]+$/, ""), name, url, bytes: stat.size, kind: ["mp4","webm"].includes(extension) ? "video" : ["mp3","wav","ogg"].includes(extension) ? "audio" : "image" });
      });
      await unlink(source);
    }
  })().catch(error => { runtime.sparkleStartup = undefined; throw error; });
  return runtime.sparkleStartup;
}
