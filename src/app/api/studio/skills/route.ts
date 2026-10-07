import { skillRegistry, coreSkillRegistry } from "@/lib/studio/skill-registry";
import { jsonResponse } from "@/lib/studio/http";

export async function GET() {
  return jsonResponse({ skills: skillRegistry, coreSkills: coreSkillRegistry });
}
