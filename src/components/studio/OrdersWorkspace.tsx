"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, ArrowUpRight } from "lucide-react";
import type { OrderRecord, OrdersResponse, UpdateOrderInput } from "../../../schemas/order";
import { request, readLocal, storeLocal } from "./data";
import { StudioShell } from "./StudioShell";
import { Dialog } from "./Dialog";
import { initializeWorkspace } from "./persistence";
import "./orders.css";

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const statusLabels: Record<OrderRecord["status"], string> = { demo: "Demo purchase", in_progress: "In progress", delivered: "Awaiting payment", paid: "Payment recorded", cancelled: "Cancelled" };
type ProjectOption = { id: string; name: string };
type LegacyOrder = { id: string; name: string; amount: number; kind: string; date: string };
let migration: Promise<void> | undefined;
async function migratePurchases() {
  // Strict Mode and multiple mounted views share one migration; retries remain idempotent server-side.
  if (!migration) migration = (async () => {
    const legacy = readLocal<LegacyOrder[]>("sparkle:orders", []);
    if (!Array.isArray(legacy) || !legacy.length) return;
    for (let offset = 0; offset < legacy.length; offset += 200) {
      await request("/api/orders/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orders: legacy.slice(offset, offset + 200) }) });
    }
    // Keep a browser backup; future orders use the server ledger exclusively.
    storeLocal("sparkle:orders-backup", legacy);
    storeLocal("sparkle:orders", []);
  })().catch(error => { migration = undefined; throw error; });
  await migration;
}

export function OrdersWorkspace() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [filter, setFilter] = useState("All orders");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [creating, setCreating] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [action, setAction] = useState<{ order: OrderRecord; kind: UpdateOrderInput["action"] | "request_changes" } | null>(null);
  const createAttempt = useRef<{ fingerprint: string; requestId: string } | null>(null);
  const mutationLock = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      await initializeWorkspace();
      await migratePurchases();
      const result = await request<OrdersResponse>("/api/orders");
      if (active) setData(result);
    })().catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  useEffect(() => {
    if (!creating) return;
    let active = true;
    request<{ projects: ProjectOption[] }>("/api/projects")
      .then(result => { if (active) setProjects(result.projects); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setProjectsLoading(false); });
    return () => { active = false; };
  }, [creating]);
  function openCreate() { setError(""); setProjectsLoading(true); setCreating(true); }
  async function run(work: () => Promise<void>) {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true); setError("");
    try { await work(); setRefresh(value => value + 1); }
    catch (e) { setError((e as Error).message); }
    finally { mutationLock.current = false; setBusy(false); }
  }
  async function createAd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const amount = String(fields.get("amount"));
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) { setError("Enter an amount with no more than two decimal places."); return; }
    const [dollars, cents = ""] = amount.split(".");
    const input = { type: "ad_commission", name: String(fields.get("name")).trim(), clientName: String(fields.get("clientName")).trim(), projectId: String(fields.get("projectId")), amountCents: Number(dollars) * 100 + Number(cents.padEnd(2, "0")) };
    const fingerprint = JSON.stringify(input);
    if (createAttempt.current?.fingerprint !== fingerprint) createAttempt.current = { fingerprint, requestId: crypto.randomUUID() };
    const requestId = createAttempt.current.requestId;
    await run(async () => {
      await request("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, requestId }) });
      createAttempt.current = null; setCreating(false); setFilter("Creative work");
    });
  }
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    const fields = new FormData(event.currentTarget);
    if (action.kind === "request_changes") {
      await run(async () => { await request(`/api/commissions/${action.order.commissionId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request_changes", feedback: String(fields.get("feedback")) }) }); setAction(null); });
      return;
    }
    const input: UpdateOrderInput = action.kind === "deliver"
      ? { action: "deliver", deliveryUrl: String(fields.get("deliveryUrl")).trim() }
      : action.kind === "record_payment"
        ? { action: "record_payment", receiptReference: String(fields.get("receiptReference")).trim() }
        : { action: "cancel" };
    await run(async () => {
      await request(`/api/orders/${action.order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      setAction(null);
    });
  }
  async function approve(order: OrderRecord) {
    await run(async () => { await request(`/api/commissions/${order.commissionId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "accept" }) }); });
  }
  async function pay(order: OrderRecord) {
    await run(async () => {
      const { payment } = await request<{ payment: { checkoutUrl?: string } }>("/api/payments/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: crypto.randomUUID(), orderId: order.id }) });
      if (!payment.checkoutUrl) throw new Error("Payment is unresolved. Reconcile the existing payment attempt before trying again.");
      location.assign(payment.checkoutUrl);
    });
  }
  const orders = data?.orders.filter(order => filter === "All orders" || order.type === (filter === "Template purchases" ? "template_purchase" : "ad_commission")) ?? [];
  const openAction = (order: OrderRecord, kind: UpdateOrderInput["action"] | "request_changes") => { setError(""); setAction({ order, kind }); };

  return <StudioShell pageTitle="Orders" description="Template purchases and earnings from your ads." actions={
    <button className="primary-button compact" onClick={openCreate}><Plus size={15} />New ad order</button>
  }>
    <main className="commerce-page page-scroll orders-page">
      {error && !creating && !action && <div className="orders-error" role="alert"><p className="error-message">{error}</p><button className="secondary-button compact" onClick={() => { setError(""); setLoading(true); setRefresh(value => value + 1); }}>Retry</button></div>}
      {loading && <p role="status">Loading orders...</p>}
      {data && <>
        <div className="stats-row">
          <div className="stat-card"><span>Template purchases</span><strong>{money(data.summary.purchaseCents)}</strong><p>Demo purchases · No real charges</p></div>
          <div className="stat-card"><span>Creative earnings</span><strong>{money(data.summary.earnedCents)}</strong><p>Payments you have confirmed receiving</p></div>
          <div className="stat-card"><span>Pending earnings</span><strong>{money(data.summary.pendingCents)}</strong><p>{data.summary.activeCommissions} active ad {data.summary.activeCommissions === 1 ? "order" : "orders"}</p></div>
        </div>
        <div className="commerce-tabs orders-filters" aria-label="Order types">{["All orders", "Template purchases", "Creative work"].map(value => <button key={value} aria-pressed={filter === value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value}</button>)}</div>
        {orders.length ? <div className="orders-table-scroll"><table className="orders-table">
          <thead><tr><th>Order</th><th>Type / Client</th><th>Status</th><th>Amount</th><th>Actions</th></tr></thead>
          <tbody>{orders.map(order => <tr key={order.id}>
            <td><strong>{order.name}</strong><small>{new Date(order.createdAt).toLocaleDateString()}{order.paidAt ? ` · Paid ${new Date(order.paidAt).toLocaleDateString()}` : ""}</small>{order.receiptReference && <small>Receipt: {order.receiptReference}</small>}</td>
            <td>{order.type === "template_purchase" ? "Template purchase" : "Ad commission"}{order.clientName && <small>{order.clientName}</small>}</td>
            <td><span className={`order-status is-${order.status}`}>{statusLabels[order.status]}</span></td>
            <td className="order-amount">{money(order.amountCents)}<small>{order.type === "template_purchase" ? "Demo expense" : "Income"}</small></td>
            <td><div className="order-actions">
              {order.type === "template_purchase" && order.status === "paid" && <button className="primary-button compact" disabled={busy} onClick={() => run(async () => { const { projectId } = await request<{ projectId: string }>(`/api/orders/${order.id}/apply`, { method: "POST" }); window.location.href = `/project/${projectId}`; })}>Use template</button>}
              {order.projectId && order.role !== "buyer" && <Link href={`/project/${order.projectId}`} className="order-link">Open canvas <ArrowUpRight size={12} /></Link>}
              {order.role === "buyer" && order.commissionStatus === "submitted" && <><button className="primary-button compact" disabled={busy} onClick={() => approve(order)}>Approve ad</button><button className="secondary-button compact" disabled={busy} onClick={() => openAction(order,"request_changes")}>Request changes</button></>}
              {order.role === "buyer" && order.commissionStatus === "accepted" && order.status !== "paid" && <button className="primary-button compact" disabled={busy} onClick={() => pay(order)}>Pay creator</button>}
              {order.deliveryUrl && <a href={order.deliveryUrl} target="_blank" rel="noreferrer" className="order-link">View delivery <ArrowUpRight size={12} /></a>}
              {order.status === "in_progress" && order.role !== "buyer" && <button className="secondary-button compact" disabled={busy} onClick={() => openAction(order, "deliver")}>Deliver ad</button>}
              {order.status === "delivered" && !order.commissionId && <button className="primary-button compact" disabled={busy} onClick={() => openAction(order, "record_payment")}>Record payment</button>}
              {["in_progress", "delivered"].includes(order.status) && order.role !== "buyer" && <button className="order-cancel" disabled={busy} onClick={() => openAction(order, "cancel")}>Cancel order</button>}
            </div></td>
          </tr>)}</tbody>
        </table></div> : <div className="empty-state">
          <h3>{filter === "Creative work" ? "No ad orders yet" : filter === "Template purchases" ? "No template purchases yet" : "No orders yet"}</h3>
          <p>Track your template purchases and paid creative work here.</p>
          <div className="orders-empty-actions"><button className="primary-button" onClick={openCreate}>New ad order <Plus size={14} /></button><Link className="secondary-button" href="/commercial/market">Explore templates <ArrowUpRight size={14} /></Link></div>
        </div>}
        <p className="orders-ledger-note">Earnings record payments received outside Sparkle. Transfers and withdrawals are not connected.</p>
      </>}
      {creating && <Dialog title="New ad order" onClose={() => { if (!busy) setCreating(false); }}>
        <form className="studio-form" onSubmit={createAd}>
          <label>Ad title<input name="name" required maxLength={160} placeholder="Product launch ad" /></label>
          <label>Client<input name="clientName" required maxLength={160} placeholder="Business or customer name" /></label>
          <label>Canvas<select name="projectId" required defaultValue="" disabled={projectsLoading}><option value="" disabled>{projectsLoading ? "Loading canvases..." : "Choose your ad project"}</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          {!projectsLoading && !projects.length && <p className="form-note">Create an ad canvas in <Link href="/">My projects</Link> first.</p>}
          <label>Agreed fee (USD)<input name="amount" type="number" required min="0.01" max="1000000" step="0.01" placeholder="250.00" /></label>
          <p className="form-note">The fee stays pending until you deliver the ad and confirm receipt of payment.</p>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy || projectsLoading || !projects.length}>{busy ? "Saving..." : "Create order"}</button>
        </form>
      </Dialog>}
      {action && <Dialog title={action.kind === "deliver" ? "Deliver ad" : action.kind === "record_payment" ? "Record received payment" : action.kind === "request_changes" ? "Request changes" : "Cancel ad order"} onClose={() => { if (!busy) setAction(null); }}>
        <form className="studio-form" onSubmit={update}>
          <p className="dialog-intro">{action.order.name} · {action.order.clientName} · {money(action.order.amountCents)}</p>
          {action.kind === "deliver" && <><label>Delivery link<input name="deliveryUrl" required maxLength={2000} placeholder="https://..." defaultValue={action.order.projectId && !action.order.commissionId ? `/project/${action.order.projectId}` : ""} /></label><p className="form-note">Save a link to the finished ad. Delivery keeps the agreed fee pending.</p></>}
          {action.kind === "record_payment" && <><label>Receipt or payment reference<input name="receiptReference" required maxLength={200} placeholder="Bank transfer or receipt reference" /></label><label className="orders-confirm"><input type="checkbox" required />I have received this payment from the client.</label><p className="form-note">This records an external payment; Sparkle does not charge the client or transfer money.</p></>}
          {action.kind === "request_changes" && <label>Feedback<textarea name="feedback" required maxLength={5000} placeholder="Explain the changes you need." /></label>}
          {action.kind === "cancel" && <p className="form-note">This removes the agreed fee from pending earnings and keeps the order in your history.</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "Saving..." : action.kind === "deliver" ? "Save delivery" : action.kind === "record_payment" ? "Confirm received payment" : action.kind === "request_changes" ? "Send feedback" : "Cancel order"}</button>
        </form>
      </Dialog>}
    </main>
  </StudioShell>;
}
