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

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "Puter Proxy",
    version: "1.4-accomplish-fixed",
    message: "Ready for Accomplish with correct GPT alias routing"
  });
});

// MODELS LIST
app.get("/v1/models", (req, res) => {
  res.json({
    object: "list",
    data: [
      { id: "x-ai/grok-4-1-fast", object: "model", owned_by: "x-ai" },
      { id: "anthropic/claude-opus-4-6", object: "model", owned_by: "anthropic" },
      { id: "anthropic/claude-sonnet-4-6", object: "model", owned_by: "anthropic" },
      { id: "anthropic/claude-opus-4-5-latest", object: "model", owned_by: "anthropic" }
    ]
  });
});

// /models alias
app.get("/models", (req, res) => {
  res.json({
    object: "list",
    data: [
      { id: "x-ai/grok-4-1-fast", object: "model" },
      { id: "anthropic/claude-opus-4-6", object: "model" }
    ]
  });
});

// Helper
function extractContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((c) => c.text || c).join("");
  return "";
}

// ────────────────────────────────────────────────
// OpenAI Chat Completions + FIXED Accomplish routing
// ────────────────────────────────────────────────
app.post("/v1/chat/completions", async (req, res) => {
  try {
    let { messages, model } = req.body;

    // 🎯 FIXED Accomplish routing (gpt-5.2 now untouched)
    const m = model?.toLowerCase() || "";

    if (m.includes("5.1") && m.includes("codex") && m.includes("max")) {
      console.log(`[Accomplish] Routing ${model} → Claude Opus 4.6`);
      model = "anthropic/claude-opus-4-6";
    }
    else if (m.includes("5.1") && m.includes("codex") && m.includes("mini")) {
      console.log(`[Accomplish] Routing ${model} → Grok 4.1 Fast`);
      model = "x-ai/grok-4-1-fast";
    }

    if (!model || model === "auto" || model === "Auto") {
      model = pickModel(messages);
    }

    if (!messages || !Array.isArray(messages)) {
      messages = [{ role: "user", content: "" }];
    }

    const response = await puter.ai.chat(messages, { model, stream: false });

    const contentText = extractContent(response.message?.content);

    res.json({
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      created: Date.now(),
      model,
      choices: [{ index: 0, message: { role: "assistant", content: contentText }, finish_reason: "stop" }],
      usage: response.usage || {},
    });
  } catch (error) {
    console.error("Error in /v1/chat/completions:", error.message);
    res.status(500).json({ error: error.message, type: "internal_error" });
  }
});

// ────────────────────────────────────────────────
// OpenAI Responses API + FIXED Accomplish routing
// ────────────────────────────────────────────────
app.post("/v1/responses", async (req, res) => {
  try {
    let { model, input, previous_response_id, temperature, max_output_tokens } = req.body;

    // 🎯 FIXED Accomplish routing (gpt-5.2 now untouched)
    const m = model?.toLowerCase() || "";

    if (m.includes("5.1") && m.includes("codex") && m.includes("max")) {
      console.log(`[Accomplish] Routing ${model} → Claude Opus 4.6`);
      model = "anthropic/claude-opus-4-6";
    }
    else if (m.includes("5.1") && m.includes("codex") && m.includes("mini")) {
      console.log(`[Accomplish] Routing ${model} → Grok 4.1 Fast`);
      model = "x-ai/grok-4-1-fast";
    }

    let messages = [];
    if (Array.isArray(input)) messages = input;
    else if (typeof input === "string") messages = [{ role: "user", content: input }];
    else messages = [{ role: "user", content: "" }];

    if (!model || model === "auto" || model === "Auto") {
      model = pickModel(messages);
    }

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
      model,
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
// Anthropic Messages
// ────────────────────────────────────────────────
app.post("/v1/messages", async (req, res) => {
  try {
    let { messages, model, max_tokens, system, prompt } = req.body;

    if (!model || model === "auto" || model === "Auto") {
      model = "anthropic/claude-opus-4-5-latest";
    }

    let allMessages = [];
    if (system) allMessages.push({ role: "system", content: system });
    if (messages && Array.isArray(messages)) allMessages.push(...messages);
    else if (prompt) allMessages.push({ role: "user", content: prompt });

    if (allMessages.length === 0) allMessages.push({ role: "user", content: "" });

    const response = await puter.ai.chat(allMessages, {
      model,
      stream: false,
      max_tokens: max_tokens || 4096,
    });

    const contentText = extractContent(response.message?.content);

    res.json({
      id: response.message?.id || "msg_" + Date.now(),
      type: "message",
      role: "assistant",
      content: contentText ? [{ type: "text", text: contentText }] : [],
      model,
      stop_reason: "end_turn",
      usage: response.usage || { input_tokens: 0, output_tokens: 0 },
    });
  } catch (error) {
    console.error("Error in /v1/messages:", error.message);
    res.status(500).json({ error: error.message, type: "error" });
  }
});

// ────────────────────────────────────────────────
// Raw Puter endpoint
// ────────────────────────────────────────────────
app.post("/chat", async (req, res) => {
  try {
    let { messages, model } = req.body;

    if (!model || model === "auto" || model === "Auto") {
      model = pickModel(messages);
    }

    if (!messages || !Array.isArray(messages)) {
      messages = [{ role: "user", content: "" }];
    }

    const response = await puter.ai.chat(messages, { model, stream: false });
    res.json(response);
  } catch (error) {
    console.error("Error in /chat:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Puter proxy running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/`);
  console.log(`✅ Models list:  http://localhost:${PORT}/v1/models`);
});
