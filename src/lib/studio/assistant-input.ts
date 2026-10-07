import { z } from "zod";
import { StudioError } from "./http";

const referenceSchema = z.object({
  id: z.string().max(160).optional(), label: z.string().max(500),
  content: z.string().max(20000).optional(), kind: z.string().max(30),
  caption: z.string().max(20000).optional(), url: z.string().max(20000).optional(),
});
export const assistantInputFields = {
  prompt: z.string().trim().min(1).max(12000),
  context: z.union([referenceSchema, z.array(referenceSchema).max(16)]).nullable().optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20000), label: z.string().max(500).optional() })).max(6).optional(),
};
export type AssistantInput = z.infer<z.ZodObject<typeof assistantInputFields>>;

export function assistantSource(input: AssistantInput) {
  const references = Array.isArray(input.context) ? input.context : input.context ? [input.context] : [];
  if (JSON.stringify(references).length > 60000) throw new StudioError("Referenced materials exceed 60,000 characters. Remove a reference and try again.");
  const source = JSON.stringify({ request: input.prompt, references, conversation: input.history || [] });
  if (source.length > 90000) throw new StudioError("Conversation and references are too long. Shorten the context and try again.");
  return source;
}
