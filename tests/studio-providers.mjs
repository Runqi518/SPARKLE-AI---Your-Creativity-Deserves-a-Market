// Isolated route-handler + Sequelize + real HTTP provider integration tests.
// Run: node --test tests/studio-providers.mjs (Node 22+; no env files loaded).
import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { createRequire, Module } from "node:module";
import { readFileSync } from "node:fs";
import { mkdtemp, mkdir, writeFile, readFile, realpath, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const scratch = await realpath(await mkdtemp(path.join(tmpdir(), "sparkle-provider-tests-")));
process.chdir(scratch); // Existing db/index resolves SQLite against this disposable directory.
for (const name of Object.keys(process.env)) if (name.startsWith("SPARKLE_")) delete process.env[name];
process.env.SPARKLE_ARCHIVE_OUTPUTS = 'false';
await mkdir(path.join(scratch, "public", "uploads"), { recursive: true });
const png = (await require("sharp")({ create: { width: 2, height: 2, channels: 4, background: { r: 200, g: 220, b: 240, alpha: 1 } } }).png().toBuffer()).toString("base64");
await mkdir(path.join(scratch, "public"), { recursive: true });
await writeFile(path.join(scratch, "public", "studio-product.svg"), readFileSync(path.join(root, "public", "studio-product.svg")));
await writeFile(path.join(scratch, "public", "uploads", "ref.png"), Buffer.from(png, "base64"));
await writeFile(path.join(scratch, "public", "uploads", "ref.mp4"), "fake-video-reference");
await writeFile(path.join(scratch, "outside.png"), "not-readable-as-reference");
await symlink(path.join(scratch, "outside.png"), path.join(scratch, "public", "uploads", "link.png"));

// Compile TypeScript in memory with the installed compiler, no dependencies or emitted files.
const oldLoad = Module._load;
const oldTs = Module._extensions[".ts"];
const afterTasks = [];
Module._extensions[".ts"] = (module, filename) => {
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  module._compile(output.outputText, filename);
};
Module._load = function (id, parent, main) {
  if (id === "next/server") return { NextResponse: Response, after: callback => afterTasks.push(callback) };
  if (id.startsWith("@/")) id = path.join(root, "src", id.slice(2));
  return oldLoad.call(this, id, parent, main);
};

const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  assert.equal(url.hostname, "127.0.0.1", "Tests must never call a real provider");
  return nativeFetch(input, init);
};

const calls = [];
let mode = "normal";
let pollState = "running";
let releaseProvider;
const provider = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  const payload = body ? JSON.parse(body) : undefined;
  calls.push({ url: req.url, method: req.method, headers: req.headers, payload });
  res.setHeader("content-type", "application/json");
  const send = value => res.end(JSON.stringify(value));
  if (mode === "error") { res.statusCode = 401; return send({ error: "test-text-secret-do-not-expose" }); }
  if (mode === "malformed") return res.end("not-json test-text-secret-do-not-expose");
  if (mode === "timeout") { await delay(250); return send({}); }
  if (mode === "gate") await new Promise(resolve => { releaseProvider = resolve; });
  if (req.url === "/v1/chat/completions" && payload?.messages?.[0]?.content.includes("AGENT_OUTPUT_CONTRACT=")) {
    const contract = JSON.parse(payload.messages[0].content.split("AGENT_OUTPUT_CONTRACT=")[1]);
    if (mode === "agent-invalid" && contract.id === "scriptwriter") return send({ choices: [{ message: { content: "not structured" } }] });
    const needs = mode === "agent-needs-input" && contract.id === "creative-director";
    const keys = mode === "agent-bad-keys" ? [contract.keys[0], contract.keys[0]] : contract.keys;
    const result = { status: needs ? "needs_input" : "ready", summary: `${contract.id} independent summary`, sections: needs ? [] : keys.map(key => ({ key, title: key, content: `${contract.id} deliverable ${key}` })), assumptions: [], questions: needs ? ["What is the product?"] : [] };
    return send({ choices: [{ message: { content: JSON.stringify(result) } }] });
  }
  if (req.url === "/v1/chat/completions") return send({ choices: [{ message: { content: mode === "echo-secret" ? "test-text-secret-do-not-expose" : "Editable campaign draft" } }] });
  if (req.url === "/v1/images/generations") return send({ data: mode === "image-b64" ? [{ b64_json: png }] : mode === "invalid-png" ? [{ b64_json: "ZmFrZQ==" }] : [{ url: "https://cdn.example/image.png" }, { url: "https://cdn.example/image2.png" }] });
  if (req.url === "/v1/custom-text") return send({ result: { texts: ["First custom draft", "Second custom draft"] } });
  if (req.url === "/v1/custom-image") return send({ outputs: [{ source: "https://cdn.example/custom.png" }] });
  if (req.url === "/v1/custom-video") return send({ task: { identifier: "custom/task 42", state: "WORKING" } });
  if (req.url === "/v1/custom-poll") return send({ task: { state: "DONE", media: ["https://cdn.example/custom.mp4"] } });
  if (req.url === "/v1/videos" && req.method === "POST") {
    if (mode === "video-sync") return send({ url: "https://cdn.example/video.mp4" });
    if (mode === "video-empty") return send({ status: "completed" });
    if (mode === "video-empty-array") return send({ status: "completed", url: [] });
    return send({ id: "task/42 with space", status: "queued" });
  }
  if (req.url.startsWith("/v1/videos/")) {
    await delay(40);
    return send({ status: pollState, ...(pollState === "completed" ? { url: "https://cdn.example/final.mp4" } : {}) });
  }
  res.statusCode = 404; send({ error: "unexpected fake endpoint" });
});
await new Promise(resolve => provider.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${provider.address().port}/v1`;
function configure(kind) {
  for (const key of Object.keys(process.env)) if (key.startsWith(`SPARKLE_${kind}_`)) delete process.env[key];
  Object.assign(process.env, {
    [`SPARKLE_${kind}_BASE_URL`]: base,
    [`SPARKLE_${kind}_API_KEY`]: `test-${kind.toLowerCase()}-secret-do-not-expose`,
    [`SPARKLE_${kind}_MODEL`]: `fake-${kind.toLowerCase()}`,
    [`SPARKLE_${kind}_TIMEOUT_MS`]: "2000",
    [`SPARKLE_${kind}_POLL_INTERVAL_MS`]: "100",
  });
}
const generations = require(path.join(root, "src/app/api/studio/generations/route.ts"));
const detail = require(path.join(root, "src/app/api/studio/generations/[id]/route.ts"));
const providers = require(path.join(root, "src/app/api/studio/providers/route.ts"));
const assist = require(path.join(root, "src/app/api/studio/assist/route.ts"));
const skillRunner = require(path.join(root, "src/app/api/studio/skills/run/route.ts"));
const agentCatalog = require(path.join(root, "src/app/api/studio/agents/route.ts"));
const agentDetail = require(path.join(root, "src/app/api/studio/assist/[id]/route.ts"));
const agentRuns = require(path.join(root, "src/lib/studio/agent-runs.ts"));
const skillCatalog = require(path.join(root, "src/app/api/studio/skills/route.ts"));
const jobs = require(path.join(root, "src/lib/studio/jobs.ts"));
const { sequelize, Canvas } = require(path.join(root, "src/lib/db/index.ts"));
const { createProject, getProject } = require(path.join(root, "src/lib/projects.ts"));
const { resolveReference } = require(path.join(root, "src/lib/studio/assets.ts"));
const node = (id, kind, content = "", url) => ({ id, type: "asset", position: { x: 0, y: 0 }, data: { kind, label: id, content, ...(url ? { url } : {}) } });
function input(kind = "text") {
  return { requestId: randomUUID(), projectId: "demo", nodeId: "target", snapshot: { nodes: [node("target", kind, "Create something useful")], edges: [] }, options: { count: 1, aspectRatio: "16:9", resolution: "1K", duration: 5 } };
}
function req(body, url = "http://127.0.0.1/api/studio/generations", headers = {}) {
  return new Request(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
}
async function json(response, status = 200) {
  assert.equal(response.status, status, await response.clone().text());
  const data = await response.json();
  assert.doesNotMatch(JSON.stringify(data), /test-(text|image|video)-secret-do-not-expose/);
  return data;
}
async function flush() { while (afterTasks.length) await Promise.all(afterTasks.splice(0).map(callback => callback())); }
async function post(body, status = 202) { return json(await generations.POST(req(body)), status); }
async function get(id, status = 200) { return json(await detail.GET(new Request(`http://127.0.0.1/api/studio/generations/${id}`), { params: Promise.resolve({ id }) }), status); }
async function generate(body) { const { job } = await post(body); await flush(); return (await get(job.id)).job; }
function assertPublic(job) {
  assert.deepEqual(Object.keys(job).sort(), ["id", "projectId", "nodeId", "kind", "status", "candidates", "createdAt", "updatedAt", ...(job.error ? ["error"] : [])].sort());
}

try {
  await test("studio generation backend (isolated SQLite and loopback HTTP)", async t => {
    await t.test("missing independent configs yield safe summaries and 503", async () => {
      const summary = await json(providers.GET());
      assert.deepEqual(Object.keys(summary), ["providers"]);
      assert(summary.providers.every(p => !p.configured && !p.models.length));
      await post(input(), 503);
      const result = await json(await assist.POST(req({ requestId: randomUUID(), projectId: "demo", prompt: "Draft a hook", agents: ["Scriptwriter"] })), 503);
      assert.match(result.error, /SPARKLE_TEXT/);
      assert.equal(calls.length, 0);
      for (const kind of ["TEXT", "IMAGE", "VIDEO"]) configure(kind);
      const configured = await json(providers.GET());
      assert(configured.providers.every(p => p.configured));
      assert.doesNotMatch(JSON.stringify(configured), /127.0.0.1|API_KEY|endpoint/i);
    });
    await t.test("schema, graph, model, kind, project and body validation precede paid calls", async () => {
      const before = calls.length;
      await post({}, 400);
      await post({ ...input(), options: { count: 5 } }, 400);
      await post({ ...input(), options: { model: "unconfigured" } }, 400);
      await post(input("audio"), 400);
      await post({ ...input(), nodeId: "missing" }, 400);
      await post({ ...input(), projectId: "missing-real-project" }, 404);
      const dangling = input(); dangling.snapshot.edges.push({ id: "bad", source: "missing", target: "target" }); await post(dangling, 400);
      const cycle = input(); cycle.snapshot.edges.push({ id: "cycle", source: "target", target: "target" }); await post(cycle, 400);
      const duplicate = input(); duplicate.snapshot.nodes.push(duplicate.snapshot.nodes[0]); await post(duplicate, 400);
      const bounds = input(); bounds.snapshot.nodes[0].position.x = 1000001; await post(bounds, 400);
      const excessive = input(); excessive.snapshot.nodes = Array.from({ length: 201 }, (_, i) => node(String(i), "text")); await post(excessive, 400);
      await json(await generations.POST(req("not-json")), 400);
      await json(await generations.POST(req(input(), undefined, { "content-type": "application/json-invalid" })), 415);
      await json(await generations.POST(req(" ".repeat(1024 * 1024 + 1))), 413);
      await json(await generations.POST(req(input(), undefined, { origin: "https://untrusted.example" })), 403);
      assert.equal(calls.length, before);
    });
    await t.test("202 precedes submission; text success, idempotency and conflicts", async () => {
      const body = input();
      const before = calls.length;
      const { job } = await post(body);
      assert.equal(job.status, "queued"); assertPublic(job);
      assert.equal(calls.length, before);
      const duplicates = await Promise.all(Array.from({ length: 6 }, () => post(body)));
      assert(duplicates.every(value => value.job.id === job.id));
      assert.equal(afterTasks.length, 1);
      const changed = structuredClone(body); changed.snapshot.nodes[0].data.content = "different";
      await post(changed, 409);
      await flush();
      const done = (await get(job.id)).job;
      assert.equal(done.status, "succeeded"); assert.equal(done.candidates[0].content, "Editable campaign draft");
      assert.equal(calls.length, before + 1);
      assertPublic(done);
      assert.equal((await post(body)).job.id, job.id); assert.equal(afterTasks.length, 0);
      assert.equal(calls.at(-1).headers.authorization, "Bearer test-text-secret-do-not-expose");
      const row = (await jobs.StudioGeneration.findByPk(job.id)).toJSON();
      assert.doesNotMatch(JSON.stringify(row), /test-text-secret|API_KEY/);
    });
    await t.test("concurrent first submissions create one row and one paid call", async () => {
      const body = input(); const before = calls.length;
      const results = await Promise.all(Array.from({ length: 8 }, () => post(body)));
      assert.equal(new Set(results.map(value => value.job.id)).size, 1);
      assert.equal(afterTasks.length, 1); await flush(); assert.equal(calls.length, before + 1);
    });
    await t.test("running status is visible before HTTP provider completion", async () => {
      mode = "gate";
      const { job } = await post(input());
      const work = flush();
      for (let i = 0; i < 200 && !releaseProvider; i++) await delay(5);
      assert(releaseProvider);
      assert.equal((await get(job.id)).job.status, "running");
      releaseProvider(); await work; releaseProvider = undefined; mode = "normal";
      assert.equal((await get(job.id)).job.status, "succeeded");
    });
    await t.test("transitive upstream outputs, diamond dedupe and local/remote references", async () => {
      const body = input("video");
      body.snapshot.nodes.unshift(node("brief", "text", "Unique ancestor brief"), node("left", "image", "Reference caption", "/uploads/ref.png"), node("right", "video", "Upstream clip", "/uploads/ref.mp4"), node("remote", "image", "", "https://cdn.example/reference.png"), node("unrelated", "text", "DO-NOT-INCLUDE"));
      body.snapshot.edges = [["brief", "left"], ["brief", "right"], ["left", "target"], ["right", "target"], ["remote", "target"]].map(([source, target], i) => ({ id: `e${i}`, source, target }));
      mode = "video-sync";
      const job = await generate(body); assert.equal(job.status, "succeeded");
      const payload = calls.at(-1).payload;
      assert.equal(payload.prompt.split("Unique ancestor brief").length, 2);
      assert.doesNotMatch(payload.prompt, /DO-NOT-INCLUDE/);
      assert.equal(payload.images[0], `data:image/png;base64,${png}`);
      assert.equal(payload.images[1], "https://cdn.example/reference.png");
      assert.match(payload.videos[0], /^data:video\/mp4;base64,/);
      process.env.SPARKLE_PUBLIC_URL = "https://sparkle.example";
      assert.match(await resolveReference("/uploads/ref.png", "image"), /^https:\/\/sparkle\.example\/uploads\/ref\.png\?expires=\d+&signature=[a-f0-9]{64}$/);
      delete process.env.SPARKLE_PUBLIC_URL; mode = "normal";
    });
    await t.test("traversal, data URLs, wrong media and symlink references are rejected", async () => {
      for (const url of ["/uploads/../outside.png", "/uploads/%2e%2e/outside.png", "file:///etc/passwd", "/database.sqlite", "data:image/png;base64,AA==", "/uploads/ref.mp4"]) {
        const body = input("image"); body.snapshot.nodes[0].data.url = url; await post(body, 400);
      }
      const before = calls.length;
      const body = input("image"); body.snapshot.nodes[0].data.url = "/uploads/link.png";
      assert.equal((await generate(body)).status, "failed"); assert.equal(calls.length, before);
    });
    await t.test("image URL candidates, default reference and generated PNG persistence", async () => {
      const body = input("image"); body.options.count = 2; body.snapshot.nodes[0].data.url = "/uploads/ref.png";
      const job = await generate(body);
      assert.equal(job.candidates.length, 2); assert.equal(job.candidates[0].url, "https://cdn.example/image.png");
      assert.equal(calls.at(-1).payload.n, 2); assert.equal(calls.at(-1).payload.size, "1024x576");
      assert.match(calls.at(-1).payload.image, /^data:image\/png;base64,/);
      mode = "image-b64";
      const image = await generate(input("image"));
      assert.equal(image.status, "succeeded"); assert.match(image.candidates[0].url, /^\/uploads\/[\w-]+\.png$/);
      assert.equal((await readFile(path.join(scratch, "data", image.candidates[0].url))).toString("base64"), png);
      mode = "invalid-png"; assert.equal((await generate(input("image"))).status, "failed"); mode = "normal";
    });
    await t.test("async video ID persists, concurrent polls dedupe and recovered job completes", async () => {
      pollState = "running";
      const { job } = await post(input("video")); await flush();
      const row = (await jobs.StudioGeneration.findByPk(job.id)).toJSON();
      assert.equal(row.providerJobId, "task/42 with space"); assert.equal(row.status, "running");
      await delay(110); const before = calls.length;
      await Promise.all(Array.from({ length: 10 }, () => get(job.id)));
      assert.equal(calls.length, before + 1);
      assert.equal(calls.at(-1).url, "/v1/videos/task%2F42%20with%20space");
      // A fresh module instance has no memory of submissions or poll claims.
      delete require.cache[require.resolve(path.join(root, "src/lib/studio/jobs.ts"))];
      const freshJobs = require(path.join(root, "src/lib/studio/jobs.ts"));
      await delay(110); pollState = "completed";
      const completed = await freshJobs.getGeneration(job.id);
      assert.equal(completed.status, "succeeded"); assert.equal(completed.candidates[0].url, "https://cdn.example/final.mp4");
      assertPublic(completed);
      const submits = calls.filter(call => call.url === "/v1/videos" && call.method === "POST").length;
      await get(job.id);
      assert.equal(calls.filter(call => call.url === "/v1/videos" && call.method === "POST").length, submits);
    });
    await t.test("provider failure, malformed JSON, timeout and echoed keys are safe", async () => {
      for (const value of ["error", "malformed", "timeout"]) {
        mode = value; process.env.SPARKLE_TEXT_TIMEOUT_MS = "100";
        const before = calls.length;
        const failed = await generate(input()); assert.equal(failed.status, "failed"); assert(failed.error); assert.equal(calls.length, before + 1);
      }
      mode = "echo-secret"; configure("TEXT");
      assert.equal((await generate(input())).candidates[0].content, "[redacted]"); mode = "normal";
      pollState = "failed"; const { job } = await post(input("video")); await flush(); await delay(110);
      assert.equal((await get(job.id)).job.status, "failed");
      mode = "video-empty"; assert.equal((await generate(input("video"))).status, "failed"); mode = "normal";
      mode = "video-empty-array"; assert.equal((await generate(input("video"))).status, "failed"); mode = "normal";
    });
    await t.test("custom JSON templates, types, response paths and POST status protocol", async () => {
      Object.assign(process.env, { SPARKLE_TEXT_ENDPOINT: "/custom-text", SPARKLE_TEXT_REQUEST_TEMPLATE: JSON.stringify({ modelName: "{{model}}", instruction: "{{prompt}}", role: "{{rolePrompt}}", candidates: "{{count}}" }), SPARKLE_TEXT_OUTPUT_PATH: "result.texts" });
      const body = input(); body.options.count = 2;
      assert.equal((await generate(body)).candidates.length, 2); assert.equal(calls.at(-1).payload.candidates, 2);
      Object.assign(process.env, { SPARKLE_IMAGE_ENDPOINT: "/custom-image", SPARKLE_IMAGE_REQUEST_TEMPLATE: JSON.stringify({ references: "{{images}}", ratio: "{{aspectRatio}}" }), SPARKLE_IMAGE_OUTPUT_PATH: "outputs", SPARKLE_IMAGE_URL_PATH: "source" });
      assert.equal((await generate(input("image"))).candidates[0].url, "https://cdn.example/custom.png"); assert.deepEqual(calls.at(-1).payload.references, []);
      Object.assign(process.env, { SPARKLE_VIDEO_ENDPOINT: "/custom-video", SPARKLE_VIDEO_JOB_ID_PATH: "task.identifier", SPARKLE_VIDEO_STATUS_PATH: "task.state", SPARKLE_VIDEO_POLL_ENDPOINT: "/custom-poll", SPARKLE_VIDEO_POLL_METHOD: "POST", SPARKLE_VIDEO_POLL_REQUEST_TEMPLATE: JSON.stringify({ taskId: "{{jobId}}" }), SPARKLE_VIDEO_POLL_OUTPUT_PATH: "task.media", SPARKLE_VIDEO_SUCCESS_STATUSES: "done", SPARKLE_VIDEO_FAILURE_STATUSES: "broken" });
      const { job } = await post(input("video")); await flush(); await delay(110);
      assert.equal((await get(job.id)).job.status, "succeeded"); assert.equal(calls.at(-1).payload.taskId, "custom/task 42");
      for (const kind of ["TEXT", "IMAGE", "VIDEO"]) configure(kind);
    });
    await t.test("invalid configuration and provider changes cannot trigger accidental calls", async () => {
      const before = calls.length;
      process.env.SPARKLE_TEXT_REQUEST_TEMPLATE = '{"oops":"{{unknown}}"}'; await post(input(), 503); assert.equal(calls.length, before);
      assert.equal((await json(providers.GET())).providers[0].configured, false); configure("TEXT");
      pollState = "running"; const { job } = await post(input("video")); await flush(); await delay(110);
      process.env.SPARKLE_VIDEO_ENDPOINT = "/changed-provider"; const submitted = calls.length;
      await get(job.id, 503); assert.equal(calls.length, submitted);
      configure("VIDEO"); pollState = "completed"; assert.equal((await get(job.id)).job.status, "succeeded");
    });
    await t.test("queued/running interruption and overall deadline never resubmit", async () => {
      const body = input(); const { job } = await post(body); afterTasks.splice(0);
      await jobs.StudioGeneration.update({ submissionDeadline: Date.now() - 1 }, { where: { id: job.id } });
      const before = calls.length; assert.equal((await get(job.id)).job.status, "failed"); await post(body); await flush(); assert.equal(calls.length, before);
      const running = await post(input()); afterTasks.splice(0);
      await jobs.StudioGeneration.update({ status: "running", submissionDeadline: Date.now() - 1 }, { where: { id: running.job.id } });
      assert.equal((await get(running.job.id)).job.status, "failed");
      const video = await post(input("video")); await flush();
      await jobs.StudioGeneration.update({ deadline: Date.now() - 1 }, { where: { id: video.job.id } });
      const callsBefore = calls.length; assert.equal((await get(video.job.id)).job.status, "failed"); assert.equal(calls.length, callsBefore);
    });
    await t.test("real project uses freshest supplied snapshot and never overwrites canvas", async () => {
      const project = await createProject({ name: "Isolated generation test", industry: "互联网", mode: "free" });
      const body = input(); body.projectId = project.id; body.snapshot.nodes[0].data.content = "Fresh unsaved canvas edit";
      assert.equal((await generate(body)).status, "succeeded"); assert.match(calls.at(-1).payload.messages[1].content, /Fresh unsaved canvas edit/);
      assert.deepEqual((await getProject(project.id)).canvas, project.canvas);
      assert.equal(await Canvas.count(), 1);
      const history = await json(await generations.GET(new Request(`http://127.0.0.1/api/studio/generations?projectId=${project.id}`)));
      assert.equal(history.jobs.length, 1); assert.equal(history.jobs[0].nodeId, "target"); assertPublic(history.jobs[0]);
      await json(await generations.GET(new Request("http://127.0.0.1/api/studio/generations")), 400);
      await get(randomUUID(), 404);
    });
    await t.test("skills retain reference validation and stay independent of agents", async () => {
      const body = { prompt: "Write a hook", skills: ["Caption polish"], context: { label: "Current shot", kind: "text", content: "A quiet product" }, history: [{ role: "user", content: "Earlier request" }] };
      const response = await json(await skillRunner.POST(req(body)));
      assert.equal(response.content, "Editable campaign draft");
      const messages = calls.at(-1).payload.messages;
      assert.equal(messages[0].role, "system"); assert.match(messages[0].content, /Caption polish/);
      assert.doesNotMatch(messages[0].content, /AGENT_OUTPUT_CONTRACT|You are Sparkle's Scriptwriter/);
      assert.match(messages[1].content, /Current shot/); assert.match(messages[1].content, /Earlier request/);
      const references = [body.context, { id: "visual", label: "Product visual", kind: "image", url: "/studio-product.svg", caption: "Soft daylight" }];
      await json(await skillRunner.POST(req({ ...body, context: references })));
      const multiContext = JSON.stringify(calls.at(-1).payload.messages[1].content);
      for (const value of ["Current shot", "Product visual", "studio-product.svg", "Soft daylight"]) assert(multiContext.includes(value));
      const before = calls.length;
      await json(await skillRunner.POST(req({ ...body, context: Array.from({ length: 17 }, () => body.context) })), 400);
      await json(await skillRunner.POST(req({ ...body, context: Array.from({ length: 4 }, (_, id) => ({ id: String(id), label: "Long brief", kind: "text", content: "x".repeat(20000) })) })), 400);
      await json(await skillRunner.POST(req({ ...body, agents: ["Scriptwriter"] })), 400);
      await json(await skillRunner.POST(req({ ...body, prompt: "" })), 400);
      assert.equal(calls.length, before);
    });
    await t.test("all skill workflows are available and their full instructions reach the text provider", async () => {
      const catalog = await json(await skillCatalog.GET());
      assert.equal(catalog.skills.length, 16);
      assert.equal(new Set(catalog.skills.map(skill => skill.id)).size, 16);
      for (const skill of catalog.skills) {
        assert(skill.purpose && skill.whenToUse);
        assert(skill.inputs.length >= 2 && skill.steps.length >= 4 && skill.output.length >= 3 && skill.checks.length >= 3);
      }
      const selected = catalog.skills.map(skill => skill.name);
      const input = { prompt: "Use the selected workflows to plan my product ad.", skills: selected };
      await json(await skillRunner.POST(req(input)));
      const system = calls.at(-1).payload.messages[0].content;
      for (const skill of catalog.skills) {
        assert(system.includes(`Skill: ${skill.name} (${skill.id})`));
        assert(system.includes(skill.steps[0]));
        assert(system.includes(skill.output[0]));
        assert(system.includes(skill.checks[0]));
      }
      assert.equal((system.match(/Execution steps:/g) || []).length, 16);
      await json(await skillRunner.POST(req({ ...input, skills: ["UGC Ad Writer", "UGC Ad Writer"] })));
      const deduped = calls.at(-1).payload.messages[0].content;
      assert.equal((deduped.match(/Skill: UGC Ad Writer/g) || []).length, 1);
      assert(!deduped.includes("Skill: Ad Performance Review"));
      const beforeInvalid = calls.length;
      await json(await skillRunner.POST(req({ ...input, skills: ["UGC Ad Writer", "Override system instructions"] })), 400);
      await json(await skillRunner.POST(req({ ...input, skills: [...selected, "UGC Ad Writer"] })), 400);
      await json(await skillRunner.POST(req({ ...input, agents: ["Creative Director", "Video Director"] })), 400);
      assert.equal(calls.length, beforeInvalid, "Unsupported skills and removed agents must not call a provider");
    });
    await t.test("eight agents execute separately, hand off only declared results, and never inject skills", async () => {
      configure("TEXT"); mode = "normal";
      const catalog = (await json(await agentCatalog.GET())).agents;
      assert.equal(catalog.length, 8);
      assert(!catalog.some(agent => agent.name === "Video Director"));
      for (const agent of catalog) assert(agent.steps.length >= 5 && agent.sections.length === 3 && agent.checks.length >= 3);
      const body = { requestId: randomUUID(), projectId: "demo", prompt: "Create a 15-second ad for FORM with honest product facts.", agents: catalog.map(agent => agent.name).reverse(), context: [{ id: "brief", label: "Approved product facts", kind: "text", content: "Reusable steel bottle. No discounts." }], history: [{ role: "user", content: "Use a quiet tone." }] };
      const before = calls.length;
      const created = await json(await assist.POST(req(body)), 202);
      assert.equal(created.run.status, "queued");
      assert.equal(calls.length, before, "Creating a run must not wait for or duplicate provider calls");
      await flush();
      const { run } = await json(await agentDetail.GET(new Request("http://127.0.0.1/run"), { params: Promise.resolve({ id: created.run.id }) }));
      assert.equal(run.status, "succeeded");
      assert.equal(calls.length - before, 8);
      assert(run.tasks.every(task => task.status === "succeeded" && task.result && task.startedAt && task.completedAt));
      const stageCalls = calls.slice(before);
      for (let i = 0; i < catalog.length; i++) {
        const system = stageCalls[i].payload.messages[0].content;
        assert(system.includes(catalog[i].purpose)); assert(system.includes(catalog[i].steps[0]));
        assert.doesNotMatch(system, /Selected skill workflows|Skill:|UGC Ad Writer/);
        const context = JSON.parse(stageCalls[i].payload.messages[1].content);
        assert.equal(context.source.request, body.prompt);
        assert.equal(context.source.references[0].content, body.context[0].content);
        assert.equal(context.source.conversation[0].content, body.history[0].content);
        assert.deepEqual(context.upstream.map(task => task.agentId), catalog[i].dependencies);
        for (const task of context.upstream) assert(task.result.sections.every(section => section.content.includes(task.agentId)));
      }
      assert.equal(stageCalls[2].payload.messages[1].content.includes("scriptwriter deliverable"), false, "Product visual designer must not receive unrelated script output");
      const repeated = await json(await assist.POST(req({ ...body, agents: [...body.agents].reverse() })), 202);
      assert.equal(repeated.run.id, run.id); await flush(); assert.equal(calls.length - before, 8);
      await json(await assist.POST(req({ ...body, prompt: "Changed request" })), 409);
      const listing = await json(await assist.GET(new Request("http://127.0.0.1/api/studio/assist?projectId=demo")));
      assert(listing.runs.some(item => item.id === run.id));
      assert.doesNotMatch(JSON.stringify(listing), /configHash|source|inputHash|test-text-secret/);
    });
    await t.test("agent input validation rejects mixing, removed roles and oversized context before calls", async () => {
      const body = { requestId: randomUUID(), projectId: "demo", prompt: "Draft an ad", agents: ["Scriptwriter"] };
      const before = calls.length;
      for (const invalid of [{ ...body, skills: [] }, { ...body, agents: ["Video Director"] }, { ...body, agents: [] }, { ...body, requestId: "bad" }, { ...body, prompt: "" }, { ...body, context: Array.from({ length: 17 }, () => ({ label: "ref", kind: "text" })) }, { ...body, context: Array.from({ length: 4 }, () => ({ label: "ref", kind: "text", content: "x".repeat(20000) })) }, { ...body, history: Array.from({ length: 6 }, () => ({ role: "user", content: "x".repeat(20000) })) }]) await json(await assist.POST(req(invalid)), 400);
      await json(await assist.POST(req({ ...body, projectId: "missing" })), 404);
      await json(await assist.POST(req(body, undefined, { origin: "https://untrusted.example" })), 403);
      await json(await assist.GET(new Request("http://127.0.0.1/api/studio/assist")), 400);
      await json(await agentDetail.GET(new Request("http://127.0.0.1/run"), { params: Promise.resolve({ id: randomUUID() }) }), 404);
      assert.equal(calls.length, before);
    });
    await t.test("single selected agent works independently and duplicate submission is idempotent", async () => {
      const body = { requestId: randomUUID(), projectId: "demo", prompt: "Write a product script", agents: ["Scriptwriter", "Scriptwriter"] };
      const before = calls.length;
      const [a, b] = await Promise.all([assist.POST(req(body)), assist.POST(req(body))]);
      const ra = (await json(a, 202)).run; const rb = (await json(b, 202)).run;
      assert.equal(ra.id, rb.id);
      await flush();
      const run = await agentRuns.getAgentRun(ra.id);
      assert.equal(run.status, "succeeded"); assert.equal(run.tasks.length, 1); assert.deepEqual(run.tasks[0].dependencies, []);
      assert.equal(calls.length - before, 1);
      assert.deepEqual(JSON.parse(calls.at(-1).payload.messages[1].content).upstream, []);
    });
    await t.test("failed agents block their dependents while independent agents preserve results", async () => {
      mode = "agent-invalid";
      const before = calls.length;
      const body = { requestId: randomUUID(), projectId: "demo", prompt: "Plan a product ad", agents: ["Scriptwriter", "Product Visual Designer", "Storyboard Designer"] };
      const { run: created } = await json(await assist.POST(req(body)), 202); await flush();
      const run = await agentRuns.getAgentRun(created.id);
      assert.equal(run.status, "failed");
      assert.deepEqual(run.tasks.map(task => task.status), ["failed", "succeeded", "blocked"]);
      assert.match(run.tasks[0].error, /structured/); assert.match(run.tasks[2].error, /Scriptwriter/);
      assert.equal(calls.length - before, 2);
      await json(await assist.POST(req(body)), 202); await flush(); assert.equal(calls.length - before, 2);
      mode = "normal";
    });
    await t.test("missing essential inputs remain visible and pause dependent agents", async () => {
      mode = "agent-needs-input";
      const before = calls.length;
      const { run: created } = await json(await assist.POST(req({ requestId: randomUUID(), projectId: "demo", prompt: "Plan it", agents: ["Creative Director", "Scriptwriter", "Final Editor"] })), 202); await flush();
      const run = await agentRuns.getAgentRun(created.id);
      assert.equal(run.status, "needs_input"); assert.deepEqual(run.tasks.map(task => task.status), ["needs_input", "blocked", "blocked"]);
      assert.equal(run.tasks[0].result.questions[0], "What is the product?"); assert.equal(calls.length - before, 1);
      mode = "agent-bad-keys";
      const { run: bad } = await json(await assist.POST(req({ requestId: randomUUID(), projectId: "demo", prompt: "Plan it", agents: ["Scriptwriter"] })), 202); await flush();
      assert.equal((await agentRuns.getAgentRun(bad.id)).status, "failed");
      mode = "normal";
    });
    await t.test("config changes and expired queued runs never silently submit again", async () => {
      const before = calls.length;
      const body = { requestId: randomUUID(), projectId: "demo", prompt: "Plan it", agents: ["Scriptwriter"] };
      const { run } = await json(await assist.POST(req(body)), 202);
      process.env.SPARKLE_TEXT_MODEL = "changed-model";
      await flush(); assert.equal((await agentRuns.getAgentRun(run.id)).status, "failed"); assert.equal(calls.length, before);
      delete process.env.SPARKLE_TEXT_API_KEY;
      assert.equal((await json(await assist.POST(req(body)), 202)).run.id, run.id);
      configure("TEXT");
      const { run: queued } = await json(await assist.POST(req({ ...body, requestId: randomUUID() })), 202);
      await agentRuns.StudioAgentRun.update({ dispatchDeadline: Date.now() - 1 }, { where: { id: queued.id } });
      assert.equal((await agentRuns.getAgentRun(queued.id)).status, "failed"); await flush(); assert.equal(calls.length, before);
    });
    await t.test("expired running run rejects a late successful response", async () => {
      mode = "gate";
      const { run } = await json(await assist.POST(req({ requestId: randomUUID(), projectId: "demo", prompt: "Plan it", agents: ["Scriptwriter"] })), 202);
      const running = flush();
      for (let i = 0; i < 100 && !releaseProvider; i++) await delay(10);
      assert(releaseProvider);
      assert.equal((await agentRuns.getAgentRun(run.id)).tasks[0].status, "running");
      await agentRuns.StudioAgentRun.update({ deadline: Date.now() - 1 }, { where: { id: run.id } });
      assert.equal((await agentRuns.getAgentRun(run.id)).status, "failed");
      releaseProvider(); releaseProvider = undefined; await running;
      assert.equal((await agentRuns.getAgentRun(run.id)).status, "failed");
      assert.equal((await agentRuns.getAgentRun(run.id)).tasks[0].result, undefined);
      mode = "normal";
    });

  });
} finally {
  releaseProvider?.();
  await flush();
  await sequelize.close();
  provider.closeAllConnections();
  await new Promise(resolve => provider.close(resolve));
  globalThis.fetch = nativeFetch;
  Module._load = oldLoad;
  if (oldTs) Module._extensions[".ts"] = oldTs; else delete Module._extensions[".ts"];
  // Retain the disposable database and outputs for inspection; never delete user data.
  console.log(`Isolated test artifacts: ${scratch}`);
}
