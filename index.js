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

// CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// TEMPORARY DEBUG LOGGING
app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.originalUrl);
  next();
});

// Middleware
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

// Model Routing Function
function routeModel(model) {
  const m = (model || "").toLowerCase();

  if (m.includes("5.1") && m.includes("max")) return "anthropic/claude-opus-4-6";
  if (m.includes("5.1") && m.includes("mini")) return "x-ai/grok-4-1-fast";
  if (m.includes("5.2")) return "anthropic/claude-opus-4-6";
  if (m.includes("nano")) return "anthropic/claude-opus-4-6";

  return "anthropic/claude-opus-4-6";
}

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "Puter Proxy for Accomplish",
    version: "1.7-responses-alias",
    message: "Supports both /responses and /v1/responses"
  });
});

// Model routes (both point to same list)
app.get("/v1/models", (req, res) => res.json(openaiModelList));
app.get("/models",    (req, res) => res.json(openaiModelList));

// Helper
function extractContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((c) => c.text || c).join("");
  return "";
}

// ────────────────────────────────────────────────
// OpenAI Responses API (main handler)
// ────────────────────────────────────────────────
app.post("/v1/responses", async (req, res) => {
  try {
    let { model, input, previous_response_id, temperature, max_output_tokens } = req.body;

    const originalModel = model;
    model = routeModel(model);

    console.log(`[Router] ${originalModel} → ${model}`);

    if (!originalModel || originalModel === "auto" || originalModel === "Auto") {
      model = pickModel(input || []);
    }

    let messages = [];
    if (Array.isArray(input)) messages = input;
    else if (typeof input === "string") messages = [{ role: "user", content: input }];
    else messages = [{ role: "user", content: "" }];

    const puterResponse = await puter.ai.chat(messages, {
      model,
      stream: false,
      ...(temperature !== undefined && { temperature }),
      ...(max_output_tokens !== undefined && { max_tokens: max_output_tokens }),
    });

    const contentText = extractContent(puterResponse.message?.content || puterResponse);

    res.json({
      id: `resp_${Date.now().toString(36)}`,
      object: "response",
      created: Math.floor(Date.now() / 1000),
      model: originalModel,
      output: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: contentText }],
        },
      ],
      usage: puterResponse.usage || { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
      ...(previous_response_id && { previous_response_id }),
    });
  } catch (err) {
    console.error("Error in /v1/responses:", err.message);
    res.status(500).json({ error: { message: err.message, type: "internal_error" } });
  }
});

// ────────────────────────────────────────────────
// Alias for Accomplish: POST /responses → POST /v1/responses
// ────────────────────────────────────────────────
app.post("/responses", async (req, res) => {
  req.url = "/v1/responses";
  app._router.handle(req, res);
});

// Chat Completions (unchanged)
app.post("/v1/chat/completions", async (req, res) => { /* your current code */ });

// Anthropic & Raw (unchanged)
app.post("/v1/messages", async (req, res) => { /* your current code */ });
app.post("/chat", async (req, res) => { /* your current code */ });

// Start server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Puter proxy running on http://localhost:${PORT}`);
  console.log(`✅ Supports /responses (no /v1) for Accomplish`);
});
