import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";

// Run against an already-running local Next server. Provider calls are browser
// fixtures, not service tests; never send valid generation requests with fetch.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.STUDIO_URL || "http://localhost:3001";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  serviceWorkers: "block",
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
const ids = new Set();
const uploaded = new Set();
const tracking = [];
const errors = [];
const blocked = [];
const results = [];
const jobs = new Map();
const generationRequests = [];
const assistRequests = [];
let nextOutcome = "succeeded";
const runName = `Studio browser ${Date.now()}`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=", "base64");
page.on("pageerror", error => errors.push(error.message));
page.on("dialog", dialog => dialog.accept());
page.on("response", response => {
  const url = new URL(response.url());
  if (response.status() !== 201) return;
  if (url.pathname === "/api/projects" && response.request().method() === "POST") {
    tracking.push(response.json().then(({ project }) => ids.add(project.id)));
  }
  if (url.pathname === "/api/studio/upload") {
    tracking.push(response.json().then(asset => uploaded.add(asset.url)));
  }
});

// A fail-closed allowlist also catches accidental use of legacy task/provider
// endpoints. Install before any navigation; no route.fetch() in AI fixtures.
await context.route("**/*", async route => {
  const request = route.request();
  const url = new URL(request.url());
  const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  if (url.origin !== new URL(base).origin) {
    blocked.push(`${request.method()} ${url.origin}${url.pathname}`);
    return route.abort();
  }
  if (url.pathname === "/api/studio/providers") {
    return json({ providers: ["text", "image", "video"].map(kind => ({ kind, configured: true, defaultModel: `fake-${kind}`, models: [`fake-${kind}`, `fake-${kind}-alternate`] })) });
  }
  if (url.pathname === "/api/studio/assist") {
    assistRequests.push(request.postDataJSON());
    return json({ content: "Browser fixture: keep the product story simple." });
  }
  if (url.pathname === "/api/studio/generations") {
    if (request.method() === "GET") {
      return json({ jobs: [...jobs.values()].map(entry => entry.job).filter(job => job.projectId === url.searchParams.get("projectId")).reverse() });
    }
    if (request.method() === "POST") {
      const input = request.postDataJSON();
      generationRequests.push(input);
      const node = input.snapshot.nodes.find(node => node.id === input.nodeId);
      const job = { id: `browser-job-${generationRequests.length}`, projectId: input.projectId, nodeId: input.nodeId, kind: node.data.kind, status: "queued", candidates: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      jobs.set(job.id, { job, input, outcome: nextOutcome, release: false, polls: 0 });
      nextOutcome = "succeeded";
      return json({ job }, 201);
    }
  }
  if (url.pathname.startsWith("/api/studio/generations/")) {
    const entry = jobs.get(url.pathname.split("/").at(-1));
    if (!entry) return json({ error: "Unknown browser fixture job" }, 404);
    entry.polls++;
    entry.job.status = entry.release ? entry.outcome : "running";
    if (entry.job.status === "failed") entry.job.error = "Browser fixture: provider rejected generation.";
    if (entry.job.status === "succeeded") {
      entry.job.candidates = Array.from({ length: entry.input.options.count }, (_, index) => ({
        id: `${entry.job.id}-candidate-${index + 1}`,
        kind: entry.job.kind,
        ...(entry.job.kind === "text" ? { content: `Browser candidate ${index + 1}: a new product story.` } : { url: index === 0 ? "/studio-product.svg" : "/studio-object.svg" }),
      }));
    }
    return json({ job: entry.job });
  }
  if (url.pathname.startsWith("/api/") && !/^\/api\/(projects(?:\/[^/]+(?:\/canvas)?)?|subjects|studio\/upload)$/.test(url.pathname)) {
    blocked.push(`${request.method()} ${url.pathname}`);
    return json({ error: "Blocked non-fixture API in browser test" }, 503);
  }
  return route.continue();
});

class QuotaSkip extends Error {}

async function eventually(read, predicate, message) {
  let value;
  for (let attempt = 0; attempt < 60; attempt++) {
    value = await read();
    if (predicate(value)) return value;
    await page.waitForTimeout(150);
  }
  assert.fail(`${message}: ${JSON.stringify(value)}`);
}

async function project(id) {
  assert.ok(ids.has(id), "Only inspect test-created project IDs");
  const response = await fetch(`${base}/api/projects/${id}`);
  assert.equal(response.status, 200);
  return (await response.json()).project;
}

async function saved(id, predicate) {
  return eventually(() => project(id), value => predicate(value.canvas), "Canvas did not persist expected state");
}

async function deleteOwn(id) {
  assert.ok(ids.has(id), "Never delete an unknown project");
  const response = await fetch(`${base}/api/projects/${id}`, { method: "DELETE" });
  assert.ok([200, 204, 404].includes(response.status), `Cleanup ${id}: ${response.status}`);
  ids.delete(id);
}

async function createdBy(action) {
  const pending = page.waitForResponse(response => new URL(response.url()).pathname === "/api/projects" && response.request().method() === "POST");
  await action();
  const response = await pending;
  const data = await response.json();
  if (response.status() === 409) {
    const listing = await fetch(`${base}/api/projects`).then(response => response.json());
    if (listing.projects.length >= listing.limit) throw new QuotaSkip(`Project quota ${listing.projects.length}/${listing.limit}; unknown projects untouched`);
  }
  assert.equal(response.status(), 201, JSON.stringify(data));
  ids.add(data.project.id);
  await page.waitForURL(`${base}/project/${data.project.id}`);
  await page.locator(".save-status").filter({ hasText: "saved" }).waitFor();
  return data.project.id;
}

async function create(name, mode = "Free", basicType) {
  await page.goto(base);
  await page.getByRole("button", { name: "Start creating", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`${mode} creation`) }).click();
  await page.getByLabel("Project name").fill(name);
  if (basicType) await page.getByLabel("Starting point").selectOption(basicType);
  return createdBy(() => page.getByRole("button", { name: "Open canvas", exact: true }).click());
}

const node = label => page.locator(".asset-node").filter({ has: page.locator(".node-caption strong").getByText(label, { exact: true }) });
const nav = name => page.locator(".studio-sidebar").getByRole("link", { name, exact: true });

async function fit() {
  await page.getByRole("button", { name: "Fit canvas", exact: true }).click();
  await page.waitForTimeout(400);
}

async function edit(label, name, content) {
  await node(label).getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  if (content !== undefined) await dialog.getByLabel("Content", { exact: true }).fill(content);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await node(name).waitFor();
}

async function screenshot(name) {
  if (!process.env.SCREENSHOT_DIR) return;
  const destination = path.join(process.env.SCREENSHOT_DIR, name);
  await page.screenshot({ path: destination });
  console.log(`SCREENSHOT ${destination}`);
}

async function test(name, action) {
  try {
    await action();
    results.push({ name, status: "PASS" });
    console.log(`PASS ${name}`);
  } catch (error) {
    const status = error instanceof QuotaSkip ? "SKIP" : "FAIL";
    results.push({ name, status });
    console.error(`${status} ${name}: ${error.stack}`);
    if (status === "FAIL") await screenshot(`sparkle-failure-${results.length}.png`).catch(() => {});
  } finally {
    // Stop autosaves before deleting only IDs returned by this browser's POSTs.
    await page.goto("about:blank");
    await Promise.all(tracking);
    for (const id of [...ids]) await deleteOwn(id);
  }
}

try {
  await test("routes, legacy redirects and invalid server requests", async () => {
    for (const route of ["/", "/project/demo", "/assets", "/commercial/market", "/commercial/subjects", "/commercial/orders"]) {
      assert.equal((await fetch(base + route)).status, 200, route);
    }
    for (const [route, target] of [["/commercial/match", "/commercial/market?view=own"], ["/commercial/bounties", "/commercial/subjects"]]) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      assert.equal(response.url, base + target);
    }
    assert.equal((await fetch(base + "/commercial/unknown")).status, 404);
    assert.equal((await fetch(base + "/api/studio/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: "", agents: [], skills: [] }) })).status, 400);
    assert.equal((await fetch(base + "/api/studio/generations", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 400);
    const invalid = new FormData();
    invalid.append("file", new Blob(["<script>bad</script>"], { type: "text/html" }), "test.html");
    assert.equal((await fetch(base + "/api/studio/upload", { method: "POST", body: invalid })).status, 415);
  });

  await test("free creation, editing, undo/redo, scoped assist, upload and timeline reload", async () => {
    const id = await create(`${runName} editor`);
    await page.getByText("Every idea starts somewhere.").waitFor();
    assert.equal(await page.locator(".asset-node").count(), 0);
    await page.getByRole("button", { name: "Add text", exact: true }).click();
    await edit("Untitled text", "A tested idea", "A quieter, simpler product story.");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await node("Untitled text").waitFor();
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await node("A tested idea").waitFor();
    await page.getByRole("button", { name: "Add agent", exact: true }).click();
    await page.locator(".picker-item").filter({ hasText: "Scriptwriter" }).click();
    await page.getByRole("button", { name: "Close picker" }).click();
    await page.locator(".skills-trigger").click();
    await page.locator(".picker-item").filter({ hasText: "Caption polish" }).click();
    await page.getByRole("button", { name: "Close picker" }).click();
    assert.equal(await page.locator(".team-chips button").count(), 2);
    assert.equal(await page.locator(".skill-chips button").count(), 1);
    await node("A tested idea").getByRole("button", { name: "Ask AI" }).click();
    await page.locator(".ai-panel .chat-compose .context-chip").filter({ hasText: "A tested idea" }).waitFor();
    await page.getByLabel("Message your creative team").fill("Make this product story more concise.");
    await page.getByRole("button", { name: "Send message" }).click();
    await page.locator(".chat-message.assistant").getByText("Browser fixture: keep the product story simple.", { exact: true }).waitFor();
    assert.equal(assistRequests.at(-1).context.label, "A tested idea");
    assert.ok(assistRequests.at(-1).agents.includes("Scriptwriter"));
    assert.deepEqual(assistRequests.at(-1).skills, ["Caption polish"]);
    assert.equal(await page.locator(".asset-node").count(), 1, "Assist must not automatically add output");
    await page.locator('input[type="file"]').setInputFiles({ name: "studio-smoke.png", mimeType: "image/png", buffer: png });
    await node("studio-smoke.png").waitFor();
    await page.getByRole("button", { name: "Timeline", exact: true }).click();
    assert.equal(await page.locator(".timeline-track").count(), 5);
    await page.locator(".timeline-clip").filter({ hasText: "A tested idea" }).dblclick();
    await page.getByLabel("Start in seconds").fill("2");
    await page.getByLabel("Duration in seconds").fill("6");
    await page.getByRole("button", { name: "Save changes" }).click();
    await saved(id, canvas => canvas.nodes.length === 2 && canvas.nodes.some(node => node.data.label === "A tested idea" && node.data.start === 2 && node.data.duration === 6));
    await page.reload();
    await node("A tested idea").waitFor();
    assert.equal(await page.locator(".team-chips button").count(), 2);
    assert.equal(await page.locator(".skill-chips button").count(), 1);
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download project" }).click();
    assert.match((await download).suggestedFilename(), /\.json$/);
    await page.getByRole("button", { name: "Publish template", exact: true }).click();
    await page.getByLabel("Template name").fill(`${runName} canvas publication`);
    await page.getByLabel("Description", { exact: true }).fill("Published directly from the tested canvas.");
    await page.getByRole("button", { name: "Publish preview template", exact: true }).click();
    await nav("Templates").click();
    await page.getByRole("button", { name: `View ${runName} canvas publication`, exact: true }).waitFor();
    await nav("Assets").click();
    await page.getByRole("heading", { name: "studio-smoke.png", exact: true }).waitFor();
  });

  await test("UI graph roundtrip, cycle rejection, disconnect undo and per-node settings", async () => {
    const id = await create(`${runName} graph`);
    await page.getByRole("button", { name: "Add text", exact: true }).click();
    await edit("Untitled text", "Original copy", "Keep this original output.");
    await node("Original copy").getByRole("button", { name: "Input", exact: true }).click();
    await node("Original copy").locator(".linked-node-menu").getByRole("button", { name: "Text", exact: true }).click();
    await fit();
    await edit("Untitled text", "Upstream brief", "A reference, not generated output.");
    await node("Original copy").locator(".node-generate-toggle").click();
    await node("Original copy").getByRole("button", { name: "Next", exact: true }).click();
    await node("Original copy").locator(".linked-node-menu").getByRole("button", { name: "Image", exact: true }).click();
    await fit();
    await edit("Untitled image", "Original visual");
    let state = await saved(id, canvas => canvas.nodes.length === 3 && canvas.edges.length === 2);
    const byLabel = label => state.canvas.nodes.find(node => node.data.label === label).id;
    const briefId = byLabel("Upstream brief");
    const copyId = byLabel("Original copy");
    const imageId = byLabel("Original visual");
    const connections = canvas => canvas.edges.map(edge => `${edge.source}->${edge.target}`).sort();
    const expected = [`${briefId}->${copyId}`, `${copyId}->${imageId}`].sort();
    assert.deepEqual(connections(state.canvas), expected);
    await page.reload();
    await node("Original copy").waitFor();
    await fit();
    assert.equal(await page.locator(".react-flow__edge").count(), 2);
    assert.deepEqual(connections((await project(id)).canvas), expected);

    await node("Original visual").locator(".node-generate-toggle").click();
    await fit();
    await node("Original visual").getByRole("button", { name: "Disconnect Original copy", exact: true }).click();
    await saved(id, canvas => canvas.edges.length === 1);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await saved(id, canvas => connections(canvas).join() === expected.join());

    await node("Original visual").getByRole("button", { name: "Disconnect Original copy", exact: true }).click();
    await saved(id, canvas => canvas.edges.length === 1);
    const sourceHandle = await node("Original copy").getByLabel("Connect output from Original copy").boundingBox();
    const targetHandle = await node("Original visual").getByLabel("Connect input to Original visual").boundingBox();
    assert.ok(sourceHandle && targetHandle);
    await page.mouse.move(sourceHandle.x + sourceHandle.width / 2, sourceHandle.y + sourceHandle.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetHandle.x + targetHandle.width / 2, targetHandle.y + targetHandle.height / 2, { steps: 20 });
    await page.mouse.up();
    await saved(id, canvas => connections(canvas).join() === expected.join());

    // Real pointer interaction attempts a back edge, not a direct state edit.
    const output = await node("Original visual").getByLabel("Connect output from Original visual").boundingBox();
    const input = await node("Upstream brief").getByLabel("Connect input to Upstream brief").boundingBox();
    assert.ok(output && input);
    await page.mouse.move(output.x + output.width / 2, output.y + output.height / 2);
    await page.mouse.down();
    await page.mouse.move(output.x + output.width / 2 + 30, output.y + output.height / 2 + 30, { steps: 4 });
    await page.locator(".react-flow__connection-path").waitFor();
    await page.mouse.move(input.x + input.width / 2, input.y + input.height / 2, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(750);
    assert.equal(await page.locator(".react-flow__edge").count(), 2, "Cycle must be rejected");
    assert.deepEqual(connections((await project(id)).canvas), expected);

    await node("Original visual").getByRole("button", { name: "Disconnect Original copy", exact: true }).click();
    await saved(id, canvas => canvas.edges.length === 1);
    await page.getByRole("button", { name: "Undo", exact: true }).focus();
    await page.keyboard.press("ControlOrMeta+z");
    await saved(id, canvas => connections(canvas).join() === expected.join());

    await node("Original copy").locator(".node-generate-toggle").click();
    await fit();
    await node("Original copy").getByLabel("Prompt for Original copy").fill("Write two restrained product headlines.");
    await node("Original copy").getByLabel("Model for Original copy").selectOption("fake-text-alternate");
    await node("Original copy").getByLabel("Candidate count").selectOption("2");
    await node("Original visual").locator(".node-generate-toggle").click();
    await fit();
    await node("Original visual").getByLabel("Prompt for Original visual").fill("Photograph the product in soft daylight.");
    await node("Original visual").getByLabel("Model for Original visual").selectOption("fake-image-alternate");
    await node("Original visual").getByLabel("Aspect ratio").selectOption("4:3");
    await node("Original visual").getByLabel("Resolution").selectOption("2K");
    await node("Original visual").getByLabel("Candidate count").selectOption("3");
    state = await saved(id, canvas => canvas.nodes.find(node => node.id === imageId)?.data.generationOptions?.count === 3);
    assert.equal(state.canvas.nodes.find(node => node.id === copyId).data.prompt, "Write two restrained product headlines.");
    assert.equal(state.canvas.nodes.find(node => node.id === copyId).data.generationOptions.count, 2);
    assert.equal(state.canvas.nodes.find(node => node.id === briefId).data.prompt, undefined);
    await page.reload();
    await node("Original copy").waitFor();
    await fit();
    await node("Original visual").locator(".node-generate-toggle").click();
    assert.equal(await node("Original visual").getByLabel("Prompt for Original visual").inputValue(), "Photograph the product in soft daylight.");
    assert.equal(await node("Original visual").getByLabel("Aspect ratio").inputValue(), "4:3");
    assert.equal(await node("Original visual").getByLabel("Resolution").inputValue(), "2K");
    assert.equal(await node("Original visual").getByLabel("Model for Original visual").inputValue(), "fake-image-alternate");
    await node("Original copy").locator(".node-generate-toggle").click();
    assert.equal(await node("Original copy").getByLabel("Candidate count").inputValue(), "2");
    assert.equal(await node("Original copy").getByLabel("Model for Original copy").inputValue(), "fake-text-alternate");
    await screenshot("sparkle-graph.png");
  });

  await test("mocked text/image polling, manual candidates, undo, recovery and generation failure", async () => {
    const id = await create(`${runName} generation`);
    await page.getByRole("button", { name: "Add text", exact: true }).click();
    await edit("Untitled text", "Preserved copy", "The original text must survive generation.");
    await fit();
    const beforeInvalid = generationRequests.length;
    await node("Preserved copy").getByRole("button", { name: "Generate text", exact: true }).click();
    await node("Preserved copy").getByRole("alert").filter({ hasText: "Describe what you want to generate first." }).waitFor();
    assert.equal(generationRequests.length, beforeInvalid, "Empty prompts must not submit");

    for (const kind of ["text", "image"]) {
      let label = "Preserved copy";
      if (kind === "image") {
        await node("Preserved copy").getByRole("button", { name: "Next", exact: true }).click();
        await node("Preserved copy").locator(".linked-node-menu").getByRole("button", { name: "Image", exact: true }).click();
        await fit();
        await node("Untitled image").getByRole("button", { name: "Edit", exact: true }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Replace image" }).click();
        await page.locator('input[type="file"]').setInputFiles({ name: "original-generation.png", mimeType: "image/png", buffer: png });
        label = "original-generation.png";
        await node(label).waitFor();
      }
      await fit();
      const current = node(label);
      const output = kind === "text" ? current.locator(".text-preview p") : current.locator(".node-preview img");
      const readOutput = () => kind === "text" ? output.textContent() : output.getAttribute("src");
      const original = await readOutput();
      await current.getByLabel(`Prompt for ${label}`).fill(`Create ${kind} candidates for a product launch.`);
      await current.getByLabel("Candidate count").selectOption("2");
      const requestCount = generationRequests.length;
      await current.getByRole("button", { name: `Generate ${kind}`, exact: true }).click();
      await eventually(() => generationRequests.length, count => count === requestCount + 1, "Missing mocked generation POST");
      const entry = [...jobs.values()].at(-1);
      await eventually(() => entry.polls, polls => polls >= 1, "Page must poll the fake provider job");
      assert.equal(await current.getByRole("button", { name: `Generate ${kind}`, exact: true }).isDisabled(), true);
      assert.equal(await readOutput(), original, "Running generation must preserve old output");
      assert.equal(await current.locator(".generation-candidates button").count(), 0);
      assert.equal(entry.input.projectId, id);
      assert.equal(entry.input.options.count, 2);
      assert.equal(entry.input.snapshot.nodes.find(node => node.id === entry.job.nodeId).data.prompt, `Create ${kind} candidates for a product launch.`);
      if (kind === "image") assert.equal(entry.input.snapshot.edges.length, 1, "Generation must carry graph context");
      entry.release = true;
      await current.getByRole("button", { name: "Use candidate 2", exact: true }).waitFor();
      assert.equal(entry.job.status, "succeeded");
      assert.ok(entry.polls >= 2, "Success must arrive through browser GET polling");
      assert.equal(await readOutput(), original, "Successful results are not automatically applied");
      await current.getByRole("button", { name: "Use candidate 2", exact: true }).click();
      const applied = kind === "text" ? entry.job.candidates[1].content : entry.job.candidates[1].url;
      assert.equal(await readOutput(), applied);
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      assert.equal(await readOutput(), original, "Undo restores output without discarding candidates");
      assert.equal(await current.locator(".generation-candidates button").count(), 2);
      await saved(id, canvas => canvas.nodes.some(node => node.id === entry.job.nodeId && node.data.candidates?.length === 2 && (kind === "text" ? node.data.content : node.data.url) === original));
      if (kind === "text") {
        await page.reload();
        await node(label).getByRole("button", { name: "Use candidate 2", exact: true }).waitFor();
        await fit();
        assert.equal(await readOutput(), original, "Reload recovers results without applying them");
      }
      nextOutcome = "failed";
      await current.getByRole("button", { name: `Generate ${kind}`, exact: true }).click();
      await eventually(() => generationRequests.length, count => count === requestCount + 2, "Missing failed-job POST");
      const failed = [...jobs.values()].at(-1);
      await eventually(() => failed.polls, polls => polls >= 1, "Failed job must be polled");
      failed.release = true;
      await current.getByRole("alert").filter({ hasText: "Browser fixture: provider rejected generation." }).waitFor();
      assert.equal(failed.job.status, "failed");
      assert.equal(await readOutput(), original, "Failed generation must not fabricate output");
      assert.equal(await current.locator(".generation-candidates button").count(), 2, "Failure must not add false candidates");
      assert.deepEqual(failed.job.candidates, []);
      assert.equal(await current.getByRole("button", { name: `Generate ${kind}`, exact: true }).isDisabled(), false);
    }
    await fit();
    const dismiss = page.getByRole("button", { name: "Dismiss notification" });
    if (await dismiss.isVisible()) await dismiss.click();
    await screenshot("sparkle-generation.png");
  });

  await test("My templates drafts, publish, per-work matching and graph reuse", async () => {
    const id = await create(`${runName} template`);
    await page.getByRole("button", { name: "Add text", exact: true }).click();
    await edit("Untitled text", "Template copy", "An editable template story.");
    await node("Template copy").getByRole("button", { name: "Next", exact: true }).click();
    await node("Template copy").locator(".linked-node-menu").getByRole("button", { name: "Image", exact: true }).click();
    const source = await saved(id, canvas => canvas.nodes.length === 2 && canvas.edges.length === 1);
    await nav("Templates").click();
    await page.getByRole("button", { name: /^My templates/ }).click();
    const work = page.locator(".marketspace-work").filter({ has: page.getByRole("heading", { name: `${runName} template`, exact: true }) });
    await work.getByText("Draft / unpublished", { exact: true }).waitFor();
    await work.getByRole("button", { name: "Content matching", exact: true }).click();
    let dialog = page.getByRole("dialog");
    assert.equal(await dialog.getByLabel("Content context").inputValue(), `${runName} template`);
    await dialog.getByLabel("Content context").fill("zzznomatchingbrowserfixturezzz");
    await dialog.getByRole("button", { name: "Find matching bounties" }).click();
    await dialog.getByRole("heading", { name: "No matching bounty", exact: true }).waitFor();
    const { subjects } = await fetch(base + "/api/subjects").then(response => response.json());
    if (subjects.length) {
      await dialog.getByLabel("Content context").fill(subjects[0].name);
      await dialog.getByRole("button", { name: "Find matching bounties" }).click();
      await dialog.locator(".match-row").getByRole("heading", { name: subjects[0].name, exact: true }).waitFor();
    }
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await work.getByRole("button", { name: "Save draft", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Description", { exact: true }).fill("A local browser-tested workflow.");
    await dialog.getByRole("button", { name: "Save draft", exact: true }).click();
    await work.getByText("Saved template snapshot", { exact: true }).waitFor();
    await work.getByRole("button", { name: "Publish", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Publish template", exact: true }).click();
    await work.getByText("Published", { exact: true }).waitFor();
    await work.getByRole("button", { name: "Unpublish", exact: true }).click();
    await work.getByText("Draft / unpublished", { exact: true }).waitFor();
    await page.getByRole("group", { name: "Template view" }).getByRole("button", { name: "Templates", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: `View ${runName} template`, exact: true }).count(), 0);
    await page.getByRole("button", { name: /^My templates/ }).click();
    await work.getByRole("button", { name: "Publish", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Publish template", exact: true }).click();
    await work.getByText("Published", { exact: true }).waitFor();
    await screenshot("sparkle-my-templates.png");
    // The published snapshot is browser-local; free its source slot before reuse.
    await deleteOwn(id);
    await page.getByRole("group", { name: "Template view" }).getByRole("button", { name: "Templates", exact: true }).click();
    await page.getByRole("button", { name: `View ${runName} template`, exact: true }).click();
    const clone = await createdBy(() => page.getByRole("button", { name: "Use this template", exact: true }).click());
    await node("Template copy").waitFor();
    const reused = await project(clone);
    assert.deepEqual(reused.canvas.edges, source.canvas.edges);
    assert.deepEqual(reused.canvas.nodes.map(node => node.id), source.canvas.nodes.map(node => node.id));
  });

  await test("basic image-to-video setup and confirmed own-project deletion", async () => {
    const name = `${runName} basic`;
    const id = await create(name, "Basic", "i2v");
    await page.locator(".asset-node").first().waitFor();
    const basic = await project(id);
    assert.equal(basic.basicType, "i2v");
    assert.deepEqual(basic.canvas.nodes.map(node => node.data.nodeKind || node.data.kind), ["image", "video"]);
    await nav("Projects").click();
    await page.getByRole("button", { name: `Delete ${name}`, exact: true }).click();
    await page.getByRole("button", { name: "Delete project", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal((await fetch(`${base}/api/projects/${id}`)).status, 404);
    ids.delete(id);
  });

  await test("demo purchase orders and current merchant-bounty association", async () => {
    await page.goto(base + "/commercial/market");
    await page.getByRole("button", { name: "View Sculpted in light", exact: true }).click();
    const purchase = await createdBy(() => page.getByRole("button", { name: "Demo purchase and use", exact: true }).click());
    await nav("Orders").click();
    await page.getByRole("cell", { name: "Demo template purchase", exact: true }).waitFor();
    await page.getByText("Payments not connected", { exact: true }).waitFor();
    await deleteOwn(purchase);
    await nav("Bounties").click();
    await page.getByRole("heading", { name: "Creative Bounties", exact: true }).waitFor();
    const { subjects } = await fetch(base + "/api/subjects").then(response => response.json());
    if (!subjects.length) {
      await page.getByRole("heading", { name: "No bounties yet" }).waitFor();
      console.log("SKIP subject association: no existing merchant subjects; no fictional briefs seeded");
      return;
    }
    const subject = subjects[0];
    const card = page.locator(".subject-card").filter({ has: page.getByRole("heading", { name: subject.name, exact: true }) });
    const id = await createdBy(() => card.getByRole("button", { name: "Create an ad", exact: true }).click());
    assert.equal((await project(id)).subjectId, subject.id);
  });

  await test("single-word navigation, resize drag/keyboard, computed fonts and mobile screenshots", async () => {
    await page.goto(base + "/project/demo");
    await page.locator(".asset-node").first().waitFor();
    for (const name of ["Projects", "Assets", "Templates", "Bounties", "Orders"]) assert.equal(await nav(name).count(), 1);
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => ({
      navigation: getComputedStyle(document.querySelector(".nav-group a")).fontFamily,
      heading: getComputedStyle(document.querySelector(".ai-header h2")).fontFamily,
      headingWeight: getComputedStyle(document.querySelector(".ai-header h2")).fontWeight,
      body: getComputedStyle(document.querySelector(".assistant-welcome p")).fontFamily,
      regularLoaded: [...document.fonts].some(font => font.family.includes("Chakra Petch") && font.weight === "400" && font.status === "loaded"),
      boldLoaded: [...document.fonts].some(font => font.family.includes("Chakra Petch") && font.weight === "700" && font.status === "loaded"),
    }));
    assert.match(fonts.navigation, /^"?Chakra Petch/);
    assert.match(fonts.heading, /^"?Chakra Petch/);
    assert.equal(fonts.headingWeight, "700");
    assert.match(fonts.body, /^"?Helvetica Neue/);
    assert.ok(fonts.regularLoaded && fonts.boldLoaded, JSON.stringify(fonts));
    const separator = page.getByRole("separator", { name: "Resize AI studio" });
    const panel = page.locator(".ai-panel");
    const originalWidth = (await panel.boundingBox()).width;
    const handle = await separator.boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x - 100, handle.y + handle.height / 2, { steps: 12 });
    await page.mouse.up();
    const draggedWidth = (await panel.boundingBox()).width;
    assert.ok(draggedWidth >= originalWidth + 90, `${originalWidth} -> ${draggedWidth}`);
    await separator.focus();
    await page.keyboard.press("ArrowLeft");
    assert.equal((await panel.boundingBox()).width, draggedWidth + 20);
    await page.keyboard.press("ArrowRight");
    assert.equal((await panel.boundingBox()).width, draggedWidth);
    await page.reload();
    await page.locator(".asset-node").first().waitFor();
    await eventually(() => panel.boundingBox(), box => box.width === draggedWidth, "Panel width must survive reload");
    await separator.focus();
    await page.keyboard.press("h");
    assert.equal(await page.getByRole("button", { name: "Pan tool" }).getAttribute("aria-pressed"), "true");
    await page.keyboard.press("v");
    assert.equal(await page.getByRole("button", { name: "Selection tool" }).getAttribute("aria-pressed"), "true");
    await fit();
    await screenshot("sparkle-desktop.png");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.getByRole("button", { name: "AI studio", exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await screenshot("sparkle-mobile-canvas.png");
    await page.getByRole("button", { name: "AI studio", exact: true }).click();
    await screenshot("sparkle-mobile-chat.png");
    await page.getByRole("button", { name: "Close AI studio" }).click();
    await page.getByRole("button", { name: "Open navigation" }).click();
    await nav("Templates").click();
    await page.getByRole("heading", { name: "Templates", exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await screenshot("sparkle-mobile.png");
    await page.setViewportSize({ width: 1440, height: 960 });
  });

  await test("no uncaught browser errors or unmocked provider requests", async () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(blocked, []);
    console.log(`MOCKS ${generationRequests.length} generation POSTs, ${[...jobs.values()].reduce((sum, entry) => sum + entry.polls, 0)} status GETs, ${assistRequests.length} assist POSTs`);
  });
} finally {
  await browser.close();
  await Promise.all(tracking);
  for (const id of [...ids]) await deleteOwn(id);
  for (const url of uploaded) {
    if (/^\/uploads\/[a-f0-9-]+\.png$/.test(url)) await unlink(path.join(process.cwd(), "public", url)).catch(() => {});
  }
}
console.log(`SUMMARY ${results.filter(result => result.status === "PASS").length} passed, ${results.filter(result => result.status === "FAIL").length} failed, ${results.filter(result => result.status === "SKIP").length} skipped`);
if (results.some(result => result.status === "FAIL")) process.exitCode = 1;
