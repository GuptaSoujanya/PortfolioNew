import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in environment");
  return new GoogleGenerativeAI(key);
}

// All portfolio context embedded as RAG knowledge base
const PORTFOLIO_CONTEXT = `
=== IDENTITY ===
Name: Soujanya Gupta
Title: Software Engineer | React Developer | Prompt Engineer | Full Stack Developer
Tagline: Engineering Ideas Into Intelligent Systems
Bio: I engineer high-performance digital systems that refuse to be ignored. Blending cinematic interaction design with AI-driven architecture, I build platforms that feel alive. No fluff, just pure impact.
Email: soujanyagupta.dev@gmail.com
GitHub: github.com/GuptaSoujanya
LinkedIn: linkedin.com/in/soujanya-gupta-0224621ba

=== DESIGN PHILOSOPHY ===
- Precision: Every pixel is intentional. Every interaction is engineered.
- Performance: Speed is a feature. Latency is the enemy.
- Purpose: Code without impact is just noise.

=== SKILLS ===
Frontend: React (95%), JavaScript (92%), TypeScript (85%), Tailwind CSS (88%)
Backend: Node.js (90%), MongoDB (85%), REST APIs (92%), Python (78%)
AI & Prompt Engineering: Prompt Architecture (94%), AI Integration (88%), LLM Pipelines (82%), RAG Systems (76%)
DevOps & Tools: Git & CI/CD (88%), AWS Fundamentals (72%), Docker (70%), Vite & Webpack (85%)
Highlights: 11+ Technologies, 4 Domains, 95% Top Proficiency

=== PROJECTS ===
1. RideMate (2024) — AI-powered ride sharing platform that predicts demand zones and optimizes matching between riders and drivers in real time. Stack: React, Node.js, MongoDB, REST APIs, AI Prompts. Impact: Reduced rider wait time and improved route utilization for high-density corridors. Metric: 1.2M+ Routes Optimized. Architecture: User Request → AI Demand Engine → Route Optimizer → Driver Match → Live Tracking.

2. EventHub (2023) — Smart event networking platform using OCR card scanning and AI-driven attendee matchmaking to accelerate connections. Stack: React, Express, OCR Pipeline, MongoDB, Cloud. Impact: Accelerated contact exchange and increased post-event connection rates. Metric: 50k+ Profiles Connected.

3. Resource Mgmt (2023) — Enterprise React platform to plan, allocate, and monitor team and infrastructure resources with real-time analytics. Stack: React, Node.js, Auth, Dashboards. Impact: Improved utilization visibility and reduced manual operations overhead. Metric: 99.9% Uptime Delivered.

4. Aether Engine (2024) — WebGL-based 3D rendering engine built to power immersive, browser-based cinematic experiences with photorealistic lighting. Stack: Three.js, WebGL, TypeScript, GLSL. Impact: Delivered console-quality rendering performance directly within the browser. Metric: 60fps Render Target.

5. Chronos Sync (2023) — High-frequency real-time data streaming pipeline engineered to handle massive throughput for financial market analytics. Stack: Go, Kafka, Redis, WebSockets. Impact: Provided sub-second data synchronization across distributed global nodes. Metric: 5M+ Events/Sec.

6. Nexus Protocol (2022) — Decentralized identity verification network utilizing zero-knowledge proofs for instantaneous, privacy-preserving authentication. Stack: Rust, Solidity, React, Cryptography. Impact: Eliminated central points of failure and reduced authentication latency. Metric: 10ms Verification Time.

=== EXPERIENCE ===
1. Green Rider Technology — Software Engineer (Current): Building scalable web modules, shipping user-facing experiences, and improving reliability across product surfaces.
2. CodeAlpha — Developer Intern (Previous): Delivered frontend features, collaborated on API integration, and improved interaction quality for core workflows.
3. Robrotronix India — Engineering Trainee (Earlier): Contributed to embedded and software experiments with a focus on practical problem-solving and prototyping.

=== CAREER TIMELINE ===
1. Foundation: Mastered core systems thinking and the raw mechanics of software architecture.
2. Web Engineering: Architected scalable React applications and robust MERN stack platforms.
3. AI + Prompt Systems: Pioneered AI-first interaction models and advanced prompt engineering pipelines.

=== STATISTICS ===
3+ Years Building, 15+ Systems Shipped, 10k+ Lines of Code, 100% Impact Driven
`;

const SYSTEM_PROMPT = `You are Soujanya Gupta's AI portfolio assistant. You answer questions about Soujanya using ONLY the knowledge base provided below. You speak in first person as if you are representing Soujanya.

Rules:
1. Answer based ONLY on the provided knowledge base. Do not make up information.
2. Be conversational, friendly, and concise.
3. If asked something not in the knowledge base, say "I don't have that information, but you can reach Soujanya directly at soujanyagupta.dev@gmail.com"
4. For technical questions about skills/projects, give specific details from the knowledge base.
5. Keep responses short (2-4 sentences) unless the user asks for detail.
6. Use a confident, professional tone that matches the portfolio's energy.

KNOWLEDGE BASE:
${PORTFOLIO_CONTEXT}`;

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export async function chatWithAssistant(
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });

  // Build conversation context
  const conversationHistory = history
    .slice(-10) // Keep last 10 messages for context
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`)
    .join("\n");

  const fullPrompt = `${SYSTEM_PROMPT}

${conversationHistory ? `--- CONVERSATION HISTORY ---\n${conversationHistory}\n` : ""}
--- USER MESSAGE ---
${userMessage}

Respond concisely as Soujanya's portfolio assistant:`;

  const result = await model.generateContent(fullPrompt);
  const response = result.response;
  return response.text().trim();
}
