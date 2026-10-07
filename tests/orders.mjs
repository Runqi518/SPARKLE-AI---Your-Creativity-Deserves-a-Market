// Exercises real route handlers and a disposable SQLite ledger, never the user's database.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire, Module } from "node:module";
import { readFileSync } from "node:fs";
import { mkdtemp, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const previousCwd = process.cwd();
const scratch = await realpath(await mkdtemp(path.join(tmpdir(), "sparkle-orders-test-")));
process.chdir(scratch);
const oldLoad = Module._load;
const oldTs = Module._extensions[".ts"];
Module._extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
};
Module._load = function (id, parent, main) {
  if (id.startsWith("@/")) id = path.join(root, "src", id.slice(2));
  return oldLoad.call(this, id, parent, main);
};
const routes = require(path.join(root, "src/app/api/orders/route.ts"));
const detail = require(path.join(root, "src/app/api/orders/[id]/route.ts"));
const migration = require(path.join(root, "src/app/api/orders/import/route.ts"));
const { sequelize, Project, Canvas, syncDatabase } = require(path.join(root, "src/lib/db/index.ts"));
const req = (body, method = "POST", headers = {}) => new Request("http://localhost/api/orders", { method, headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
async function json(response, status = 200) { assert.equal(response.status, status, await response.clone().text()); return response.json(); }
const post = (body, status = 201) => routes.POST(req(body)).then(res => json(res, status));
const update = (id, body, status = 200) => detail.PATCH(req(body, "PATCH"), { params: Promise.resolve({ id }) }).then(res => json(res, status));
const list = () => routes.GET().then(json);
const commission = (overrides = {}) => ({ requestId: randomUUID(), type: "ad_commission", name: "Launch ad", projectId: "ad-project", clientName: "Test client", amountCents: 25001, ...overrides });
try {
  await test("Orders backend: purchases, delivery and creative revenue", async t => {
    await syncDatabase();
    const { saveLibraryItem } = require(path.join(root, "src/lib/library.ts"));
    await saveLibraryItem("templates", { id: "template1", name: "Ad template", category: "Community", description: "Test template", image: "/studio-object.svg", price: 24, published: true, nodes: [], edges: [] });
    await Project.create({ id: "ad-project", name: "Launch canvas", mode: "free", industry: "Internet" });
    await Canvas.create({ projectId: "ad-project", nodes: [], edges: [] });
    await t.test("empty ledger returns server-calculated zero totals", async () => {
      assert.deepEqual(await list(), { orders: [], summary: { purchaseCents: 0, earnedCents: 0, pendingCents: 0, activeCommissions: 0 } });
    });
    await t.test("invalid cents, absent projects, status forging and cross-origin writes are rejected", async () => {
      await post(commission({ amountCents: 2.5 }), 400);
      await post(commission({ amountCents: -10 }), 400);
      await post(commission({ amountCents: 0 }), 400);
      await post(commission({ amountCents: 100000001 }), 400);
      await post(commission({ projectId: "missing" }), 404);
      await post(commission({ status: "paid" }), 400);
      await json(await routes.POST(req(commission(), "POST", { origin: "https://other.example" })), 403);
      await json(await routes.POST(req(commission(), "POST", { "content-type": "text/plain" })), 415);
      assert.equal((await list()).orders.length, 0);
    });
    let ad;
    await t.test("creating an ad order records pending income with retry deduplication", async () => {
      const input = commission();
      ad = (await post(input)).order;
      assert.equal(ad.status, "in_progress");
      assert.equal(ad.clientName, "Test client");
      assert.equal((await post(input)).order.id, ad.id);
      await post({ ...input, amountCents: 999 }, 409);
      assert.equal((await list()).orders.length, 1);
      assert.deepEqual((await list()).summary, { purchaseCents: 0, earnedCents: 0, pendingCents: 25001, activeCommissions: 1 });
    });
    await t.test("demo purchase is an expense, never income or a payable charge", async () => {
      const purchase = (await post({ requestId: randomUUID(), type: "template_purchase", projectId: "ad-project", templateId: "template1", name: "Ad template", amountCents: 2400 })).order;
      assert.equal(purchase.status, "demo");
      await update(purchase.id, { action: "record_payment", receiptReference: "receipt" }, 409);
      assert.deepEqual((await list()).summary, { purchaseCents: 2400, earnedCents: 0, pendingCents: 25001, activeCommissions: 1 });
    });
    await t.test("delivery requires a safe link and payment cannot precede delivery", async () => {
      await update(ad.id, { action: "record_payment", receiptReference: "receipt" }, 409);
      await update(ad.id, { action: "deliver", deliveryUrl: "javascript:alert(1)" }, 400);
      await update(ad.id, { action: "deliver", deliveryUrl: "//evil.example" }, 400);
      await update(ad.id, { action: "deliver", deliveryUrl: "/project/\\evil.example" }, 400);
      await update(ad.id, { action: "deliver", deliveryUrl: "/project/ad-project" });
      const repeated = (await update(ad.id, { action: "deliver", deliveryUrl: "/project/ad-project" })).order;
      assert.equal(repeated.status, "delivered");
      assert(repeated.deliveredAt);
      assert.equal((await list()).summary.earnedCents, 0);
      await update(ad.id, { action: "deliver", deliveryUrl: "https://different.example" }, 409);
      await update(ad.id, { action: "record_payment", receiptReference: " " }, 400);
      await update("missing-order", { action: "cancel" }, 404);
    });
    await t.test("confirmed receipt moves exact cents into income once; paid orders are immutable", async () => {
      const paid = (await update(ad.id, { action: "record_payment", receiptReference: "TRANSFER-TEST-01" })).order;
      assert.equal(paid.status, "paid");
      assert(paid.paidAt);
      await update(ad.id, { action: "record_payment", receiptReference: "TRANSFER-TEST-01" });
      await update(ad.id, { action: "record_payment", receiptReference: "OTHER" }, 409);
      await update(ad.id, { action: "cancel" }, 409);
      await update(ad.id, { action: "record_payment", receiptReference: "TRANSFER-TEST-01", amountCents: 99999 }, 400);
      assert.deepEqual((await list()).summary, { purchaseCents: 2400, earnedCents: 25001, pendingCents: 0, activeCommissions: 0 });
    });
    await t.test("cancelled jobs stay in history and leave pending totals", async () => {
      const cancelled = (await post(commission({ amountCents: 9999 }))).order;
      await update(cancelled.id, { action: "cancel" });
      await update(cancelled.id, { action: "cancel" });
      await update(cancelled.id, { action: "deliver", deliveryUrl: "https://example.test/ad.mp4" }, 409);
      assert.equal((await list()).summary.pendingCents, 0);
    });
    await t.test("legacy migration preserves purchases, dates and amounts without duplicates", async () => {
      const old = { id: "old-browser-id", name: "Legacy template", amount: 18.25, kind: "Demo template purchase", date: "2026-10-01T00:00:00.000Z" };
      await json(await migration.POST(req({ orders: [old, old] })));
      await json(await migration.POST(req({ orders: [old] })));
      const ledger = await list();
      assert.equal(ledger.summary.purchaseCents, 4225);
      assert.equal(ledger.orders.filter(item => item.name === old.name).length, 1);
      assert.equal(ledger.orders.find(item => item.name === old.name).createdAt, old.date);
      await json(await migration.POST(req({ orders: [{ ...old, id: "rolled-back" }, { ...old, amount: 19 }] })), 409);
      assert(!(await list()).orders.some(item => item.name === old.name && item.amountCents === 1900));
      assert.equal((await list()).orders.length, ledger.orders.length);
    });
    await t.test("deleting the original canvas retains recorded revenue and purchase history", async () => {
      await Canvas.destroy({ where: { projectId: "ad-project" } });
      await Project.destroy({ where: { id: "ad-project" } });
      assert.equal((await list()).summary.earnedCents, 25001);
      const [rows] = await sequelize.query("SELECT amountCents, status FROM CommerceOrders WHERE id = :id", { replacements: { id: ad.id } });
      assert.equal(rows[0].amountCents, 25001);
      assert.equal(rows[0].status, "paid");
    });
  });
} finally {
  await sequelize.close();
  Module._load = oldLoad;
  if (oldTs) Module._extensions[".ts"] = oldTs; else delete Module._extensions[".ts"];
  process.chdir(previousCwd);
}
