import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire, Module } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const filename = path.join(root, "src/components/studio/campaign-templates.ts");
const mod = new Module(filename);
mod.filename = filename;
mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, filename);
const { templates, templateIndustries, adLayers } = mod.exports;

test("real campaign references cover every requested industry with full creative plans", () => {
  assert.equal(templates.length, 12);
  assert.equal(new Set(templates.map(t => t.id)).size, templates.length);
  assert.equal(templateIndustries.length, 10);
  for (const industry of templateIndustries) {
    assert.ok(templates.some(t => t.industry === industry), `Missing ${industry}`);
  }
  for (const template of templates) {
    assert.ok(existsSync(path.join(root, "public", template.image)), template.image);
    assert.match(template.image, /\.(jpg|png|webp)$/);
    assert.equal(new URL(template.imageCredit.url).protocol, "https:");
    assert.ok(template.styles.length >= 3);
    for (const { key } of adLayers) assert.ok(template.adPlan[key].length > 70, `${template.id}: ${key}`);
  }
});

test("every template opens its own editable connected workflow without dangling links or cycles", () => {
  for (const template of templates) {
    // Same serialization boundary used by the canvas persistence API.
    const { nodes, edges } = JSON.parse(JSON.stringify(template));
    assert.equal(nodes.length, 9);
    assert.equal(edges.length, 9);
    const ids = new Set(nodes.map(n => n.id));
    assert.equal(ids.size, nodes.length);
    for (const layer of adLayers) {
      const node = nodes.find(n => n.id === layer.key);
      assert.equal(node.data.kind, "text");
      assert.equal(node.data.content, template.adPlan[layer.key]);
    }
    assert.equal(nodes.find(n => n.id === "campaign-reference").data.url, template.image);
    const draft = nodes.find(n => n.id === "film-draft");
    assert.equal(draft.data.kind, "video");
    assert.ok(!draft.data.url, "A planning template must not invent a generated film");
    for (const layer of adLayers) assert.ok(draft.data.prompt.includes(template.adPlan[layer.key]));
    for (const edge of edges) { assert.ok(ids.has(edge.source)); assert.ok(ids.has(edge.target)); }
    const visited = new Set();
    const visiting = new Set();
    const walk = id => {
      assert.ok(!visiting.has(id), `Cycle in ${template.id}`);
      if (visited.has(id)) return;
      visiting.add(id);
      for (const edge of edges.filter(e => e.source === id)) walk(edge.target);
      visiting.delete(id); visited.add(id);
    };
    for (const id of ids) walk(id);
    assert.ok(edges.some(e => e.source === "campaign-reference" && e.target === "artDirection"));
    assert.ok(edges.some(e => e.source === "execution" && e.target === "film-draft"));
  }
  assert.equal(new Set(templates.map(t => t.nodes.find(n => n.id === "concept").data.content)).size, 12);
});

test("canvas API persists and reloads each complete campaign workflow", async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const scratch = mkdtempSync(path.join(tmpdir(), "sparkle-campaign-api-"));
  const oldDirectory = process.cwd();
  const oldTs = Module._extensions[".ts"];
  const oldLoad = Module._load;
  process.chdir(scratch);
  Module._extensions[".ts"] = (module, file) => module._compile(ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, file);
  Module._load = function (id, parent, main) {
    if (id === "next/server") return { NextResponse: Response };
    if (id.startsWith("@/")) id = path.join(root, "src", id.slice(2));
    return oldLoad.call(this, id, parent, main);
  };
  let db;
  try {
    db = require(path.join(root, "src/lib/db/index.ts"));
    const projects = require(path.join(root, "src/lib/projects.ts"));
    const route = require(path.join(root, "src/app/api/projects/[id]/canvas/route.ts"));
    const project = await projects.createProject({ name: "Campaign test", industry: "Beauty", mode: "template" });
    for (const template of templates) {
      const snapshot = { nodes: template.nodes, edges: template.edges };
      const response = await route.PUT(new Request(`http://localhost/api/projects/${project.id}/canvas`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...snapshot, revision: (await projects.getProject(project.id)).revision }),
      }), { params: Promise.resolve({ id: project.id }) });
      assert.equal(response.status, 200, template.id);
      const saved = await route.GET(new Request(`http://localhost/api/projects/${project.id}/canvas`), {
        params: Promise.resolve({ id: project.id }),
      });
      assert.deepEqual((await saved.json()).canvas, snapshot, template.id);
      assert.equal((await projects.getProject(project.id)).nodesCount, 9);
    }
  } finally {
    await db?.sequelize.close();
    Module._extensions[".ts"] = oldTs;
    Module._load = oldLoad;
    process.chdir(oldDirectory);
  }
});
