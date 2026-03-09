import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PatchAction } from "../types/patchTypes.js";

function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in environment");
  return new GoogleGenerativeAI(key);
}

const SYSTEM_PROMPT = `You are an AI UI modification agent.

Your task is to generate DOM modification instructions.

Return ONLY valid JSON. No markdown, no code fences, no explanation.

Allowed actions:
- remove — completely remove an element from the DOM
- hide — set display:none on the element
- style — apply CSS styles to an element
- replace — replace an element's innerHTML
- text — change an element's text content

Output format:

{
  "actions": [
    {
      "action": "remove",
      "selector": "#hero-canvas"
    }
  ]
}

For "style" actions, include a "styles" object with camelCase CSS properties:
{
  "action": "style",
  "selector": ".navbar",
  "styles": { "backgroundColor": "#000000", "color": "#ffffff" }
}

For "replace" actions, include an "html" string:
{
  "action": "replace",
  "selector": ".hero-content h1",
  "html": "<h1>New Title</h1>"
}

For "text" actions, include a "content" string:
{
  "action": "text",
  "selector": ".hero-subtitle",
  "content": "New subtitle text"
}

Rules:
1. Changes must be temporary DOM modifications only
2. Do not modify backend logic
3. Only target DOM elements using valid CSS selectors
4. Do not generate explanations — return ONLY the JSON object
5. Never target: script, html, body, head, meta, link tags
6. Use the provided DOM structure to pick accurate selectors
7. Prefer class/id selectors over tag selectors for precision`;

export async function generatePatch(
  userPrompt: string,
  domStructure: string
): Promise<PatchAction[]> {
  const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });

  const fullPrompt = `${SYSTEM_PROMPT}

--- CURRENT PAGE DOM STRUCTURE ---
${domStructure}

--- USER REQUEST ---
${userPrompt}`;

  const result = await model.generateContent(fullPrompt);
  const response = result.response;
  const text = response.text().trim();

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  if (!parsed.actions || !Array.isArray(parsed.actions)) {
    throw new Error("Invalid response: missing actions array");
  }

  return parsed.actions as PatchAction[];
}
