import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire, Module } from "node:module";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const filename = path.join(root, "src/lib/db/index.ts");
const previousLoader = Module._extensions[".ts"];
const previousDirectory = process.cwd();

test("six default bounties survive restart without duplicating or replacing user briefs", async () => {
  process.chdir(mkdtempSync(path.join(tmpdir(), "sparkle-bounty-seeds-")));
  Module._extensions[".ts"] = (module, file) => {
    const output = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    });
    module._compile(output.outputText, file);
  };
  let db;
  try {
    db = require(filename);
    await db.syncDatabase();
    assert.equal(await db.Subject.count(), 6);
    await db.Subject.create({ id: "user-brief", name: "My personal brief", type: "product", brief: "Keep my content" });
    await db.Subject.update({ brief: "My edited scent brief" }, { where: { id: "demo-bounty-scent-ritual" } });
    await db.sequelize.close();
    delete require.cache[require.resolve(filename)];
    db = require(filename);
    await db.syncDatabase();
    assert.equal(await db.Subject.count(), 7);
    assert.equal((await db.Subject.findByPk("user-brief")).get("brief"), "Keep my content");
    assert.equal((await db.Subject.findByPk("demo-bounty-scent-ritual")).get("brief"), "My edited scent brief");
  } finally {
    await db?.sequelize.close();
    delete require.cache[require.resolve(filename)];
    Module._extensions[".ts"] = previousLoader;
    process.chdir(previousDirectory);
  }
});
