import type { ExperienceId } from "../types";
import type { Experience } from "../experiences/types";
import { ramPrashnavali } from "../experiences/ramPrashnavali";

const registry = new Map<ExperienceId, Experience>([
  [ramPrashnavali.id, ramPrashnavali],
]);

export function getExperience(id: ExperienceId): Experience | undefined {
  return registry.get(id);
}

// Phase 1 has a single active experience, so first contact always resolves to
// Ram Prashnavali. Keyword/menu routing (GITA, numbered menu) plugs in here in
// Phase 3 without touching the dispatcher.
export function routeToExperience(): Experience {
  return ramPrashnavali;
}
