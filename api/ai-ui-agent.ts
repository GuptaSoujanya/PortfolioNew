import type { VercelRequest, VercelResponse } from "@vercel/node";
import type {
  DOMStructure,
  PatchRequest,
} from "../ai-ui-agent/types/patchTypes.js";
import { processUIPrompt } from "../ai-ui-agent/backend/uiPatchService.js";

const DEFAULT_DOM_STRUCTURE: DOMStructure = {
  sections: [
    {
      name: "navbar",
      selector: ".top-nav",
      tag: "header",
      classes: ["top-nav", "glass"],
      children: [".nav-name", ".nav-actions"],
    },
    {
      name: "hero",
      selector: "#hero",
      tag: "section",
      classes: ["hero"],
      children: [
        ".hero-bg",
        ".hero-content",
        ".hero-name",
        ".hero-eyebrow",
        ".hero-tagline",
        ".hero-subtitle",
        ".hero-cta",
      ],
    },
    {
      name: "about",
      selector: "#about",
      tag: "section",
      classes: ["section"],
      children: [
        ".about-bento",
        ".story-cell",
        ".stats-cell",
        ".philosophy-cell",
        ".chapter-card",
      ],
    },
    {
      name: "projects",
      selector: "#projects",
      tag: "section",
      classes: ["section"],
      children: [
        ".projects-bento",
        ".bento-project-wrapper",
        ".project-card-inner",
      ],
    },
    {
      name: "skills",
      selector: "#skills",
      tag: "section",
      classes: ["section"],
      children: [".skills-bento", ".skills-hero-cell", ".skill-category-card"],
    },
    {
      name: "experience",
      selector: "#experience",
      tag: "section",
      classes: ["section"],
      children: [".career-flight-game"],
    },
    {
      name: "contact",
      selector: "#contact",
      tag: "section",
      classes: ["section"],
      children: [
        ".contact-split",
        ".contact-form",
        ".contact-channels",
      ],
    },
    {
      name: "footer",
      selector: ".footer",
      tag: "footer",
      classes: ["footer"],
      children: [],
    },
  ],
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { prompt, domStructure } = req.body as PatchRequest & {
      domStructure?: DOMStructure;
    };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      res.status(400).json({ error: "Missing or empty prompt" });
      return;
    }

    if (prompt.length > 500) {
      res.status(400).json({ error: "Prompt too long (max 500 characters)" });
      return;
    }

    const structure: DOMStructure = domStructure || DEFAULT_DOM_STRUCTURE;
    const actions = await processUIPrompt(prompt.trim(), structure);

    res.json({ actions });
  } catch (error) {
    console.error("[AGUI] Error processing request:", error);

    const message =
      error instanceof SyntaxError
        ? "Failed to parse AI response as JSON"
        : error instanceof Error
          ? error.message
          : "Internal server error";

    res.status(500).json({ error: message });
  }
}
