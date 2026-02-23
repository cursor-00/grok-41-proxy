import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";
import puter from "@heyputer/puter.js";
import { pickModel } from "./router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, ".env") });

// Initialize Puter.js
puter.setAuthToken(process.env.PUTER_AUTH_TOKEN);
console.log("Puter initialized, auth token present:", !!process.env.PUTER_AUTH_TOKEN);

const app = express();

// CORS + Debug Logging
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(200);

  console.log("Incoming:", req.method, req.originalUrl);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Shared OpenAI model list (for Accomplish probing)
const openaiModelList = {
  object: "list",
  data: [
    { id: "gpt-5.2", object: "model", owned_by: "openai" },
    { id: "gpt-5.2-codex", object: "model", owned_by: "openai" },
    { id: "gpt-5.1-codex-max", object: "model", owned_by: "openai" },
    { id: "gpt-5.1-codex-mini", object: "model", owned_by: "openai" },
    { id: "gpt-5-nano", object: "model", owned_by: "openai" }
  ]
};

// Native routing (nano + 5.2 stay native on Puter)
function routeModel(model) {
  const m = (model || "").toLowerCase();

  if (m.includes("5.1") && m.includes("codex") && m.includes("max")) return "anthropic/claude-opus-4-6";
  if (m.includes("5.1") && m.includes("codex") && m.includes("mini")) return "x-ai/grok-4-1-fast";
  if (m.includes("5.2")) return "openai/gpt-5.2";
  if (m.includes("nano")) return "openai/gpt-5-nano";

  return "openai/gpt-5-nano";
}

// Bulletproof extractor
function extractContent(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map(c => c?.text || c?.output_text || c?.content || "").join("");
  }
  if (typeof content === "object") {
    return content.text || content.output_text || content.content || "";
  }
  return String(content);
}

// ────────────────────────────────────────────────
// Main Chat Completions Handler (EVERYTHING goes here now)
// ────────────────────────────────────────────────
app.post("/v1/chat/completions", async (req, res) => {
  try {
    let { model, messages, temperature, max_tokens } = req.body;

    const originalModel = model;
    model = routeModel(model);

    console.log(`[Router] ${originalModel} → ${model}`);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: { message: "No messages provided", type: "invalid_request_error" }
      });
    }

    const puterResponse = await puter.ai.chat(messages, {
      model,
      stream: false,
      ...(temperature !== undefined && { temperature }),
      ...(max_tokens !== undefined && { max_tokens })
    });

    if (puterResponse?.success === false) {
      return res.status(502).json({
        error: {
          message: puterResponse.error || "Upstream model error",
          type: "provider_error"
        }
      });
    }

    const contentText = extractContent(puterResponse.message?.content || puterResponse);

    res.json({
      id: `chatcmpl_${Date.now().toString(36)}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: originalModel,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: contentText },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: puterResponse?.usage?.input_tokens || 0,
        completion_tokens: puterResponse?.usage?.output_tokens || 0,
        total_tokens:
          (puterResponse?.usage?.input_tokens || 0) +
          (puterResponse?.usage?.output_tokens || 0)
      }
    });

  } catch (err) {
    console.error("FULL ERROR in /v1/chat/completions:", err);
    res.status(500).json({
      error: { message: err?.message || "Internal error", type: "internal_error" }
    });
  }
});

// Model list routes
app.get("/v1/models", (req, res) => res.json(openaiModelList));
app.get("/models",    (req, res) => res.json(openaiModelList));

// Keep these if you still need them (Anthropic + raw)
app.post("/v1/messages", async (req, res) => { /* your existing code */ });
app.post("/chat", async (req, res) => { /* your existing code */ });

// Start server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Puter proxy running on http://localhost:${PORT}`);
  console.log(`✅ All traffic now routed through /v1/chat/completions`);
});
