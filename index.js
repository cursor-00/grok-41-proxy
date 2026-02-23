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

// Correct native routing (nano + 5.2 stay native)
function routeModel(model) {
  const m = (model || "").toLowerCase();

  if (m.includes("5.1") && m.includes("codex") && m.includes("max")) return "anthropic/claude-opus-4-6";
  if (m.includes("5.1") && m.includes("codex") && m.includes("mini")) return "x-ai/grok-4-1-fast";
  if (m.includes("5.2")) return "openai/gpt-5.2";
  if (m.includes("nano")) return "openai/gpt-5-nano";

  return "openai/gpt-5-nano";
}

// Bulletproof content extractor
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
// STRICT TRANSFORMER (no fake "Hello" content)
// ────────────────────────────────────────────────
function normalizeInputToMessages(input) {
  let messages = [];

  if (Array.isArray(input) && input.length > 0) {
    messages = input
      .map(msg => {
        let contentStr = "";

        if (Array.isArray(msg.content)) {
          contentStr = msg.content
            .map(c => {
              if (typeof c === "string") return c;
              if (c && typeof c === "object") return c.text || c.output_text || c.content || "";
              return "";
            })
            .join("");
        } else if (typeof msg.content === "string") {
          contentStr = msg.content;
        }

        const clean = contentStr.trim();
        if (!clean) return null;

        return {
          role: ["user", "assistant", "system"].includes(msg.role) ? msg.role : "user",
          content: clean
        };
      })
      .filter(Boolean); // remove null/empty entries
  } else if (typeof input === "string" && input.trim()) {
    messages = [{ role: "user", content: input.trim() }];
  }

  return messages;
}

// Reusable Responses Handler
async function handleResponses(req, res) {
  try {
    let { model, input, previous_response_id, temperature, max_output_tokens } = req.body;

    const originalModel = model;
    model = routeModel(model);

    console.log(`[Router] ${originalModel} → ${model}`);

    const messages = normalizeInputToMessages(input);

    // Enforce no empty payload
    if (!messages || messages.length === 0) {
      return res.status(400).json({
        error: {
          message: "No valid user content",
          type: "invalid_request_error"
        }
      });
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
    console.error("FULL ERROR in responses:", err);
    res.status(500).json({
      error: {
        message: err?.message || JSON.stringify(err),
        type: "internal_error"
      }
    });
  }
}

// Routes
app.get("/v1/models", (req, res) => res.json(openaiModelList));
app.get("/models",    (req, res) => res.json(openaiModelList));

app.post("/v1/responses", handleResponses);
app.post("/responses",    handleResponses);

// Other routes (unchanged)
app.post("/v1/chat/completions", async (req, res) => { /* your current code */ });
app.post("/v1/messages", async (req, res) => { /* your current code */ });
app.post("/chat", async (req, res) => { /* your current code */ });

// Start server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Puter proxy running on http://localhost:${PORT}`);
  console.log(`✅ Strict transformer active — no fake content injected`);
});
