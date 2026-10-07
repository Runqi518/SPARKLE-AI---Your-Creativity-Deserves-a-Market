import { api } from "@/lib/auth";
import { sequelize } from "@/lib/db";
import { providerSummaries } from "@/lib/studio/config";
import { paymentConfigured } from "@/lib/payments";
import { jsonResponse } from "@/lib/studio/http";
export const GET = api(async () => {
  await sequelize.authenticate();
  return jsonResponse({ status: "ok", database: "sqlite", providers: providerSummaries(), paymentsConfigured: paymentConfigured() });
});
