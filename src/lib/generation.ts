import { StudioError } from "./studio/http";
import type { GenerationRequest } from "../../schemas/task";
/** @deprecated All generation now uses studio/jobs; never return a simulated success. */
export async function createGenerationTask(_request: GenerationRequest): Promise<never> { throw new StudioError("Use /api/studio/generations.", 410); }
export async function getTaskStatus(_id: string): Promise<never> { throw new StudioError("Use /api/studio/generations.", 410); }
