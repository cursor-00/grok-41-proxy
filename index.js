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

// Shared OpenAI model list
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

// TEMPORARY FORCE — all requests go to a known working model
function routeModel(model) {
  console.log(`[Router] Requested: ${model} → FORCED to anthropic/claude-opus-4-6`);
  return "anthropic/claude-opus-4-6";
}

// Bulletproof extractor
function extractContent(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(c => c?.text || c?.output_text || c?.content || "").join("");
  if (typeof content === "object") return content.text || content.output_text || content.content || "";
  return String(content);
}

// ────────────────────────────────────────────────
// /responses — Proper Responses API format
// ────────────────────────────────────────────────
app.post("/responses", async (req, res) => {
  try {
    const { model, input, temperature, max_output_tokens } = req.body;

    const routedModel = routeModel(model);

    const messages = Array.isArray(input)
      ? input.map(msg => ({
          role: msg.role || "user",
          content: Array.isArray(msg.content)
            ? msg.content.map(c => c.text || c.output_text || "").join("")
            : msg.content
        }))
      : typeof input === "string"
      ? [{ role: "user", content: input }]
      : [];

    if (!messages.length) {
      return res.status(400).json({
        error: { message: "No valid input", type: "invalid_request_error" }
      });
    }

    const puterResponse = await puter.ai.chat(messages, {
      model: routedModel,
      stream: false,
      ...(temperature !== undefined && { temperature }),
      ...(max_output_tokens !== undefined && { max_tokens: max_output_tokens })
    });

    // ← RAW DEBUG (this will show us the real Puter response)
    console.log("Puter raw response:", JSON.stringify(puterResponse));

    const contentText = extractContent(puterResponse.message?.content || puterResponse);

    res.json({
      id: `resp_${Date.now().toString(36)}`,
      object: "response",
      created: Math.floor(Date.now() / 1000),
      model,
      output: [
        {
          id: `msg_${Date.now().toString(36)}`,
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: contentText }]
        }
      ],
      usage: {
        input_tokens: puterResponse?.usage?.input_tokens || 0,
        output_tokens: puterResponse?.usage?.output_tokens || 0
      }
    });

  } catch (err) {
    console.error("FULL ERROR in /responses:", err);
    res.status(500).json({
      error: { message: err?.message || "Internal error", type: "internal_error" }
    });
  }
});

// Model list routes
app.get("/v1/models", (req, res) => res.json(openaiModelList));
app.get("/models",    (req, res) => res.json(openaiModelList));

// Optional legacy routes
app.post("/v1/chat/completions", async (req, res) => { /* your existing code */ });
app.post("/v1/messages", async (req, res) => { /* your existing code */ });
app.post("/chat", async (req, res) => { /* your existing code */ });

// Start server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Puter proxy running on http://localhost:${PORT}`);
  console.log(`✅ ALL models forced to Claude Opus 4.6 for testing`);
});
