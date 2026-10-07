import { readFile } from "node:fs/promises";
import path from "node:path";
import { skills } from "./capabilities";
import { coreSkillById, skillById, type CoreSkillId } from "./skill-registry";
import { StudioError } from "./http";

const cache = new Map<string, string>();

async function markdown(id: string) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new StudioError("Invalid skill ID.");
  const cached = cache.get(id);
  if (cached) return cached;
  const relative = path.join("src", "lib", "studio", "skills", "library", id, "SKILL.md");
  const body = await readFile(path.join(process.cwd(), relative), "utf8")
    .catch(() => readFile(path.join(__dirname, "skills", "library", id, "SKILL.md"), "utf8"))
    .catch(() => { throw new StudioError(`Skill ${id} is unavailable.`, 503); });
  const content = body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
  if (content.length > 10000 || !content) throw new StudioError(`Skill ${id} exceeds its prompt budget or is empty.`, 503);
  cache.set(id, content);
  return content;
}

export async function loadCoreSkill(id: CoreSkillId) {
  if (!coreSkillById(id)) throw new StudioError("Unknown core skill.");
  return markdown(id);
}

export async function loadStandaloneSkill(id: string) {
  const meta = skillById(id);
  if (!meta) throw new StudioError("Unknown skill.");
  return `Skill: ${meta.name} (${meta.id})\n${await markdown(id)}`;
}

export async function loadStandaloneByNames(names: string[]) {
  const selected = skills.filter(skill => names.includes(skill.name));
  const bodies = await Promise.all(selected.map(skill => loadStandaloneSkill(skill.id)));
  if (bodies.join("\n").length > 60000) throw new StudioError("Selected skills exceed the prompt budget. Choose fewer skills.");
  return bodies;
}
