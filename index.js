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

// Initialize Puter.js with your preferred method
puter.setAuthToken(process.env.PUTER_AUTH_TOKEN);
console.log("Puter initialized, auth token present:", !!process.env.PUTER_AUTH_TOKEN);

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper to extract text content from various response formats
function extractContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map((c) => c.text || c).join("");
  }
  return "";
}

// ────────────────────────────────────────────────
// OpenAI-compatible endpoint (Chat Completions)
// ────────────────────────────────────────────────
app.post("/v1/chat/completions", async (req, res) => {
  try {
    let { messages, model, stream } = req.body;

    if (!model || model === "auto" || model === "Auto") {
      model = pickModel(messages);
    }

    if (!messages || !Array.isArray(messages)) {
      messages = [{ role: "user", content: "" }];
    }

    const response = await puter.ai.chat(messages, {
      model,
      stream: false,
    });

    const contentText = extractContent(response.message?.content);

    res.json({
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      created: Date.now(),
      model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: contentText },
          finish_reason: "stop",
        },
      ],
      usage: response.usage || {},
    });
  } catch (error) {
    console.error("Error in /v1/chat/completions:", error.message);
    res.status(500).json({
      error: error.message,
      type: "internal_error",
    });
  }
});

// ────────────────────────────────────────────────
// Anthropic-compatible endpoint
// ────────────────────────────────────────────────
app.post("/v1/messages", async (req, res) => {
  try {
    let { messages, model, max_tokens, stream, system, prompt } = req.body;

    if (!model || model === "auto" || model === "Auto") {
      model = "claude-opus-4-5-latest";
    }

    let allMessages = [];

    if (system) allMessages.push({ role: "system", content: system });
    if (messages && Array.isArray(messages)) {
      allMessages.push(...messages);
    } else if (prompt) {
      allMessages.push({ role: "user", content: prompt });
    }

    if (allMessages.length === 0) {
      allMessages.push({ role: "user", content: "" });
    }

    const response = await puter.ai.chat(allMessages, {
      model,
      stream: false,
      max_tokens: max_tokens || 4096,
    });

    const contentText = extractContent(response.message?.content);

    const contentBlocks = contentText
      ? [{ type: "text", text: contentText }]
      : [];

    res.json({
      id: response.message?.id || "msg_" + Date.now(),
      type: "message",
      role: "assistant",
      content: contentBlocks,
      model,
      stop_reason: response.message?.stop_reason || "end_turn",
      usage: response.usage || { input_tokens: 0, output_tokens: 0 },
    });
  } catch (error) {
    console.error("Error in /v1/messages:", error.message);
    res.status(500).json({
      error: error.message,
      type: "error",
    });
  }
});

// ────────────────────────────────────────────────
// OpenAI Responses API (new unified agent API)
// ────────────────────────────────────────────────
app.post("/v1/responses", async (req, res) => {
  try {
    let { model, input, stream = false, previous_response_id, temperature, max_output_tokens } = req.body;

    // Convert OpenAI `input` to messages array + auto model selection
    let messages = [];
    if (Array.isArray(input)) {
      messages = input;
    } else if (typeof input === "string") {
      messages = [{ role: "user", content: input }];
    } else {
      messages = [{ role: "user", content: "" }];
    }

    if (!model || model === "auto" || model === "Auto") {
      model = pickModel(messages);
    }

    const puterOptions = {
      model,
      stream: false,
      ...(temperature !== undefined && { temperature }),
      ...(max_output_tokens !== undefined && { max_tokens: max_output_tokens }),
    };

    const puterResponse = await puter.ai.chat(messages, puterOptions);

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
          content: [
            {
              type: "output_text",
              text: contentText,
            },
          ],
        },
      ],
      usage: puterResponse.usage || {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
      },
      ...(previous_response_id && { previous_response_id }),
    });
  } catch (err) {
    console.error("Error in /v1/responses:", err.message);
    res.status(500).json({
      error: {
        message: err.message,
        type: "internal_error",
      },
    });
  }
});

// ────────────────────────────────────────────────
// Simple / raw Puter endpoint
// ────────────────────────────────────────────────
app.post("/chat", async (req, res) => {
  try {
    let { messages, model, stream } = req.body;

    if (!model || model === "auto" || model === "Auto") {
      model = pickModel(messages);
    }

    if (!messages || !Array.isArray(messages)) {
      messages = [{ role: "user", content: "" }];
    }

    const response = await puter.ai.chat(messages, {
      model,
      stream: false,
    });

    res.json(response);
  } catch (error) {
    console.error("Error in /chat:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Puter proxy server running on http://localhost:${PORT}`);
  console.log("Available routes:");
  console.log("  POST /chat                  → Raw Puter response (auto-routing)");
  console.log("  POST /v1/chat/completions   → OpenAI Chat Completions");
  console.log("  POST /v1/messages           → Anthropic Messages");
  console.log("  POST /v1/responses          → OpenAI Responses API (new!)");
});
