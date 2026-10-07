import { skills } from "@/lib/studio/capabilities";
import { skillInstructions } from "@/lib/studio/skill-instructions";
import { jsonResponse } from "@/lib/studio/http";

export async function GET() {
  return jsonResponse({ skills: skills.map(skill => ({ ...skill, ...skillInstructions[skill.id] })) });
}
