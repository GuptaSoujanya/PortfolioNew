import { Router, type Request, type Response } from "express";
import type { DOMStructure, PatchRequest } from "../types/patchTypes.js";
import { processUIPrompt } from "./uiPatchService.js";
import { chatWithAssistant, type ChatMessage } from "./ragService.js";

const router = Router();

router.post("/api/ai-ui-agent", async (req: Request, res: Response) => {
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

    // Use provided DOM structure or a sensible default
    const structure: DOMStructure = domStructure || {
      sections: [
        { name: "navbar", selector: ".top-nav", tag: "header", classes: ["top-nav", "glass"], children: [".nav-name", ".nav-actions"] },
        { name: "hero", selector: "#hero", tag: "section", classes: ["hero"], children: [".hero-bg", ".hero-content", ".hero-name", ".hero-eyebrow", ".hero-tagline", ".hero-subtitle", ".hero-cta"] },
        { name: "about", selector: "#about", tag: "section", classes: ["section"], children: [".about-bento", ".story-cell", ".stats-cell", ".philosophy-cell", ".chapter-card"] },
        { name: "projects", selector: "#projects", tag: "section", classes: ["section"], children: [".projects-bento", ".bento-project-wrapper", ".project-card-inner"] },
        { name: "skills", selector: "#skills", tag: "section", classes: ["section"], children: [".skills-bento", ".skills-hero-cell", ".skill-category-card"] },
        { name: "experience", selector: "#experience", tag: "section", classes: ["section"], children: [".career-flight-game"] },
        { name: "contact", selector: "#contact", tag: "section", classes: ["section"], children: [".contact-split", ".contact-form", ".contact-channels"] },
        { name: "footer", selector: ".footer", tag: "footer", classes: ["footer"], children: [] },
      ],
    };

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
});

// RAG Chat endpoint — answers questions about Soujanya
router.post("/api/ai-assistant/chat", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body as {
      message?: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({ error: "Missing or empty message" });
      return;
    }

    if (message.length > 1000) {
      res.status(400).json({ error: "Message too long (max 1000 characters)" });
      return;
    }

    const reply = await chatWithAssistant(message.trim(), history || []);
    res.json({ reply });
  } catch (error) {
    console.error("[RAG] Error processing chat:", error);
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: msg });
  }
});

export default router;
