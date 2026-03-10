import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import router from "./routes.js";

// Load .env from project root
dotenv.config({ path: new URL("../../.env", import.meta.url).pathname });

const app = express();
const PORT = parseInt(process.env.AGUI_PORT || process.env.PORT || "8788", 10);

// ── Middleware ───────────────────────────────────────────────────────

// Allow local dev origins (Vite default 5173, etc.) and reflect others for production
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  })
);
app.use(express.json({ limit: "50kb" }));

// ── Routes ──────────────────────────────────────────────────────────

app.use(router);

// ── Health check ────────────────────────────────────────────────────

app.get("/api/ai-ui-agent/health", (_req, res) => {
  res.json({ status: "ok", service: "ai-ui-agent" });
});

// ── Start ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  🤖 AI UI Agent server running on http://localhost:${PORT}`);
  console.log(`  📡 Endpoint: POST http://localhost:${PORT}/api/ai-ui-agent`);
  console.log(`  💡 Health:   GET  http://localhost:${PORT}/api/ai-ui-agent/health\n`);
});
