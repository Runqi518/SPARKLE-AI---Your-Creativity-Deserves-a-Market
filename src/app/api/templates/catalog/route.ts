import { api } from "@/lib/auth";
import { MarketTemplate, prepareLibrary } from "@/lib/library";
import { jsonResponse } from "@/lib/studio/http";
import { currentActor } from "@/lib/actor";
import { paymentConfigured, preparePayments, TemplateEntitlement } from "@/lib/payments";
export const GET = api(async () => {
  await prepareLibrary();
  if (paymentConfigured()) await preparePayments();
  const rows = await MarketTemplate.findAll({ ...{ hooks: false }, where: { published: true } });
  const templates = [];
  for (const row of rows) {
    const snapshot = row.get("snapshot") as Record<string, unknown>;
    const locked = paymentConfigured() && Number(row.get("amountCents")) > 0 && row.get("ownerId") !== currentActor().id && !await TemplateEntitlement.findOne({ where: { templateId: row.get("id") } });
    if (locked) { const summary = { ...snapshot }; delete summary.nodes; delete summary.edges; templates.push({ ...summary, requiresPurchase: true }); }
    else templates.push(snapshot);
  }
  return jsonResponse({ templates });
});
