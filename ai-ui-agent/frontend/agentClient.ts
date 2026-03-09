import type { PatchAction } from "../types/patchTypes";
import { scanDOM } from "./domScanner";
import { executePatch } from "./patchEngine";
import type { PatchResult } from "./applyPatch";

// ── Configuration ───────────────────────────────────────────────────

const DEFAULT_API_URL = "http://localhost:8788/api/ai-ui-agent";

export interface AgentResponse {
  actions: PatchAction[];
  patchResult: PatchResult;
}

// ── Main Client Function ────────────────────────────────────────────

/**
 * Main entry point for the AI UI Agent.
 *
 * 1. Scans the current DOM structure
 * 2. Sends prompt + structure to the backend
 * 3. Receives JSON patch actions from Gemini
 * 4. Applies patches to the DOM
 *
 * All changes are temporary — refresh to reset.
 */
export async function askUIAgent(
  prompt: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<AgentResponse> {
  console.log(`[AGUI] Processing: "${prompt}"`);

  // Step 1: Scan DOM
  const domStructure = scanDOM();
  console.log(`[AGUI] Scanned ${domStructure.sections.length} DOM sections`);

  // Step 2: Send to backend
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, domStructure }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      `[AGUI] API error ${response.status}: ${(errBody as { error?: string }).error || response.statusText}`
    );
  }

  const data = (await response.json()) as { actions: PatchAction[] };
  console.log(`[AGUI] Received ${data.actions.length} action(s) from AI`);

  // Step 3: Apply patches
  const patchResult = executePatch(data.actions);

  return { actions: data.actions, patchResult };
}

/**
 * Creates a floating AGUI command panel on the page.
 * Press Ctrl+Shift+A (or Cmd+Shift+A on Mac) to toggle.
 */
export function mountAGUIPanel(apiUrl?: string): void {
  // Prevent duplicate mount
  if (document.getElementById("agui-panel")) return;

  const panel = document.createElement("div");
  panel.id = "agui-panel";
  panel.innerHTML = `
    <div id="agui-panel-inner">
      <div id="agui-header">
        <span id="agui-title">AI UI Agent</span>
        <button id="agui-close" type="button" aria-label="Close">&times;</button>
      </div>
      <div id="agui-input-row">
        <input id="agui-input" type="text" placeholder="e.g. Make the navbar dark..." autocomplete="off" />
        <button id="agui-send" type="button">Apply</button>
      </div>
      <div id="agui-status"></div>
    </div>
  `;

  // Styles
  const style = document.createElement("style");
  style.textContent = `
    #agui-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      font-family: 'JetBrains Mono', 'SF Mono', monospace;
      font-size: 13px;
      display: none;
    }
    #agui-panel.visible { display: block; }
    #agui-panel-inner {
      background: rgba(10, 12, 20, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(138, 214, 255, 0.2);
      border-radius: 12px;
      padding: 16px;
      width: 360px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(138, 214, 255, 0.1);
    }
    #agui-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    #agui-title {
      color: #8ad6ff;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    #agui-close {
      background: none;
      border: none;
      color: #666;
      font-size: 18px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    #agui-close:hover { color: #fff; }
    #agui-input-row {
      display: flex;
      gap: 8px;
    }
    #agui-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(138, 214, 255, 0.15);
      border-radius: 8px;
      padding: 8px 12px;
      color: #e0e0e0;
      font-family: inherit;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    #agui-input:focus {
      border-color: rgba(138, 214, 255, 0.5);
    }
    #agui-input::placeholder { color: #555; }
    #agui-send {
      background: linear-gradient(135deg, #8ad6ff22, #8ad6ff44);
      border: 1px solid rgba(138, 214, 255, 0.3);
      border-radius: 8px;
      color: #8ad6ff;
      padding: 8px 16px;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: all 0.2s;
    }
    #agui-send:hover {
      background: linear-gradient(135deg, #8ad6ff33, #8ad6ff55);
      border-color: rgba(138, 214, 255, 0.5);
    }
    #agui-send:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    #agui-status {
      margin-top: 8px;
      color: #777;
      font-size: 11px;
      min-height: 16px;
    }
    #agui-status.success { color: #7effde; }
    #agui-status.error { color: #ff6b6b; }
    #agui-status.loading { color: #ffc977; }
  `;

  document.head.appendChild(style);
  document.body.appendChild(panel);

  // Wire up events
  const input = document.getElementById("agui-input") as HTMLInputElement;
  const sendBtn = document.getElementById("agui-send") as HTMLButtonElement;
  const closeBtn = document.getElementById("agui-close") as HTMLButtonElement;
  const status = document.getElementById("agui-status") as HTMLDivElement;

  async function handleSend() {
    const prompt = input.value.trim();
    if (!prompt) return;

    sendBtn.disabled = true;
    status.textContent = "Processing...";
    status.className = "loading";

    try {
      const result = await askUIAgent(prompt, apiUrl);
      status.textContent = `Applied ${result.patchResult.applied} change(s). Refresh to reset.`;
      status.className = "success";
      input.value = "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      status.textContent = msg;
      status.className = "error";
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener("click", handleSend);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
  closeBtn.addEventListener("click", () => panel.classList.remove("visible"));

  // Toggle with Ctrl+Shift+A / Cmd+Shift+A
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      panel.classList.toggle("visible");
      if (panel.classList.contains("visible")) {
        input.focus();
      }
    }
  });

  console.log("[AGUI] Panel mounted. Press Ctrl+Shift+A to toggle.");
}
