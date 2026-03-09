import type { DOMStructure, PatchAction } from "../types/patchTypes.js";
import { generatePatch } from "./geminiClient.js";
import { buildDOMContext } from "./promptBuilder.js";

// ── Selector Safety ─────────────────────────────────────────────────

const BLOCKED_SELECTORS = [
  "script",
  "html",
  "body",
  "head",
  "meta",
  "link",
  "style",
  "noscript",
];

const BLOCKED_PATTERNS = [
  /^script$/i,
  /^html$/i,
  /^body$/i,
  /^head$/i,
  /^meta/i,
  /^link$/i,
  /javascript:/i,
  /on\w+\s*=/i,
];

function isSelectorSafe(selector: string): boolean {
  const lower = selector.trim().toLowerCase();

  // Block bare tag selectors that target dangerous elements
  if (BLOCKED_SELECTORS.includes(lower)) return false;

  // Block patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lower)) return false;
  }

  // Block if selector starts with a dangerous tag
  for (const tag of BLOCKED_SELECTORS) {
    if (lower.startsWith(`${tag} `) || lower.startsWith(`${tag}.`) || lower.startsWith(`${tag}#`) || lower.startsWith(`${tag}[`)) {
      return false;
    }
  }

  return true;
}

function sanitizeActions(actions: PatchAction[]): PatchAction[] {
  return actions.filter((action) => {
    if (!action.selector || !isSelectorSafe(action.selector)) {
      console.warn(`[AGUI] Blocked unsafe selector: "${action.selector}"`);
      return false;
    }

    const validActions = ["remove", "hide", "style", "replace", "text"];
    if (!validActions.includes(action.action)) {
      console.warn(`[AGUI] Blocked unknown action: "${action.action}"`);
      return false;
    }

    // For replace actions, block script injection
    if (action.action === "replace" && action.html) {
      if (/<script/i.test(action.html)) {
        console.warn("[AGUI] Blocked script injection in replace action");
        return false;
      }
    }

    return true;
  });
}

// ── Main Service ────────────────────────────────────────────────────

export async function processUIPrompt(
  prompt: string,
  domStructure: DOMStructure
): Promise<PatchAction[]> {
  const domContext = buildDOMContext(domStructure);
  const rawActions = await generatePatch(prompt, domContext);
  return sanitizeActions(rawActions);
}
