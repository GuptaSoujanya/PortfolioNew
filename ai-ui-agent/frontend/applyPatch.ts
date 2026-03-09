import type { PatchAction } from "../types/patchTypes";

// ── Selector Safety (client-side) ───────────────────────────────────

const BLOCKED_TAGS = ["script", "html", "body", "head", "meta", "link", "style", "noscript"];

function isSelectorSafe(selector: string): boolean {
  const lower = selector.trim().toLowerCase();
  if (BLOCKED_TAGS.includes(lower)) return false;
  for (const tag of BLOCKED_TAGS) {
    if (lower === tag || lower.startsWith(`${tag} `) || lower.startsWith(`${tag}.`) || lower.startsWith(`${tag}#`)) {
      return false;
    }
  }
  return true;
}

// ── Patch Applicator ────────────────────────────────────────────────

export interface PatchResult {
  applied: number;
  skipped: number;
  errors: string[];
}

/**
 * Applies an array of patch actions to the current DOM.
 * All changes are runtime-only — a page refresh reverts everything.
 */
export function applyPatch(actions: PatchAction[]): PatchResult {
  const result: PatchResult = { applied: 0, skipped: 0, errors: [] };

  for (const action of actions) {
    try {
      // Safety check
      if (!action.selector || !isSelectorSafe(action.selector)) {
        result.errors.push(`Blocked unsafe selector: "${action.selector}"`);
        result.skipped++;
        continue;
      }

      const el = document.querySelector(action.selector) as HTMLElement | null;

      if (!el) {
        result.errors.push(`Element not found: "${action.selector}"`);
        result.skipped++;
        continue;
      }

      switch (action.action) {
        case "remove":
          el.remove();
          result.applied++;
          break;

        case "hide":
          el.style.display = "none";
          result.applied++;
          break;

        case "style":
          if (action.styles && typeof action.styles === "object") {
            Object.assign(el.style, action.styles);
            result.applied++;
          } else {
            result.errors.push(`Style action missing styles object for "${action.selector}"`);
            result.skipped++;
          }
          break;

        case "replace":
          if (typeof action.html === "string") {
            // Block script injection
            if (/<script/i.test(action.html)) {
              result.errors.push(`Blocked script injection for "${action.selector}"`);
              result.skipped++;
            } else {
              el.innerHTML = action.html;
              result.applied++;
            }
          } else {
            result.errors.push(`Replace action missing html for "${action.selector}"`);
            result.skipped++;
          }
          break;

        case "text":
          if (typeof action.content === "string") {
            el.textContent = action.content;
            result.applied++;
          } else {
            result.errors.push(`Text action missing content for "${action.selector}"`);
            result.skipped++;
          }
          break;

        default:
          result.errors.push(`Unknown action: "${(action as PatchAction).action}"`);
          result.skipped++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Error applying "${action.action}" on "${action.selector}": ${msg}`);
      result.skipped++;
    }
  }

  return result;
}
