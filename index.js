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

// ────────────────────────────────────────────────
// 1️⃣ Correct middleware order (JSON parser BEFORE logging)
// ────────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Debug logging (now sees real req.body)
app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.originalUrl);
  console.log("Incoming body:", JSON.stringify(req.body));
  next();
});

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

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

// TEMPORARY FORCE to working model
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
// Shared handler for /responses and /v1/responses
// ────────────────────────────────────────────────
async function handleResponses(req, res) {
  try {
    const { model, input, temperature, max_output_tokens, stream } = req.body;

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
      stream: !!stream,
      ...(temperature !== undefined && { temperature }),
      ...(max_output_tokens !== undefined && { max_tokens: max_output_tokens })
    });

    console.log("Puter raw response:", JSON.stringify(puterResponse));

    const contentText = extractContent(puterResponse.message?.content || puterResponse);

    // 2️⃣ Streaming support (SSE for Responses API)
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Send delta
      res.write(`data: ${JSON.stringify({
        type: "response.output_text.delta",
        delta: { text: contentText }
      })}\n\n`);

      // Send completed
      res.write(`data: ${JSON.stringify({
        type: "response.completed"
      })}\n\n`);

      return res.end();
    }

    // 3️⃣ Non-streaming Responses API format with status
    res.json({
      id: `resp_${Date.now().toString(36)}`,
      object: "response",
      status: "completed",           // ← Added for AI SDK compatibility
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
}

// 1️⃣ Both routes (removes baseURL ambiguity)
app.post("/responses", handleResponses);
app.post("/v1/responses", handleResponses);

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
  console.log(`✅ /responses + /v1/responses both supported`);
  console.log(`✅ Streaming + status: "completed" + correct middleware order`);
});
