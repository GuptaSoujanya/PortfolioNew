import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  chatWithAssistant,
  type ChatMessage,
} from "../../ai-ui-agent/backend/ragService.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { message, history } = req.body as {
      message?: string;
      history?: ChatMessage[];
    };

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      res.status(400).json({ error: "Missing or empty message" });
      return;
    }

    if (message.length > 1000) {
      res
        .status(400)
        .json({ error: "Message too long (max 1000 characters)" });
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
}
