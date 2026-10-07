import { api } from "@/lib/auth";
import { CommerceOrder, prepareOrders } from "@/lib/orders";
import { getProject, saveCanvas } from "@/lib/projects";
import { StudioError, jsonResponse } from "@/lib/studio/http";
import { CanvasSnapshotSchema } from "../../../../../../schemas/project";
export const POST = api(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await prepareOrders();
  const { id } = await params;
  const order = await CommerceOrder.findByPk(id);
  if (!order || order.get("type") !== "template_purchase" || order.get("status") !== "paid") throw new StudioError("A settled template purchase is required.", 409);
  const projectId = String(order.get("projectId"));
  if (order.get("templateApplied")) return jsonResponse({ projectId });
  const project = await getProject(projectId);
  if (!project) throw new StudioError("Purchased template project was deleted.", 404);
  const snapshot = CanvasSnapshotSchema.parse(order.get("templateSnapshot"));
  // Never replace creative work that the buyer has already started.
  if (project.canvas.nodes.length && JSON.stringify(project.canvas) !== JSON.stringify(snapshot)) throw new StudioError("This canvas contains work. Apply the purchased template to an empty canvas.", 409);
  if (!project.canvas.nodes.length) await saveCanvas(projectId, snapshot, project.revision);
  await order.update({ templateApplied: true });
  return jsonResponse({ projectId });
});
