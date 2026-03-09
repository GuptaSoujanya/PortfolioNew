import type { PatchAction } from "../types/patchTypes";
import { applyPatch, type PatchResult } from "./applyPatch";

/**
 * High-level patch engine that logs results and provides feedback.
 */
export function executePatch(actions: PatchAction[]): PatchResult {
  console.log(`[AGUI] Applying ${actions.length} patch action(s)...`);

  const result = applyPatch(actions);

  console.log(`[AGUI] Done — ${result.applied} applied, ${result.skipped} skipped`);

  if (result.errors.length > 0) {
    console.warn("[AGUI] Errors:", result.errors);
  }

  return result;
}
