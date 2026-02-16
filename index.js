import { config } from "dotenv";
config(); // Load .env immediately

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";
import { init } from "@heyputer/puter.js/src/init.cjs";
import { pickModel } from "./router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Puter.js without token first
const puter = init();

// Load and set auth token if present
if (process.env.PUTER_AUTH_TOKEN) {
  puter.setAuthToken(process.env.PUTER_AUTH_TOKEN);
  console.log("✅ Puter auth token loaded and set.");
} else {
  console.log("⚠️ No PUTER_AUTH_TOKEN found in .env — some models may return empty responses.");
}

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// OpenAI-compatible endpoint — FIXED VERSION
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

    // TEMPORARY DEBUG LOGGING — REMOVE AFTER CONFIRMING IT WORKS
    console.log("==== RAW PUTER RESPONSE FOR MODEL:", model, "====");
    console.dir(response, { depth: null });
    console.log("=======================================");

    // Directly forward the Puter response shape (it's already OpenAI-compatible for Grok)
    res.json({
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      created: Date.now(),
      model,
      choices: [
        {
          index: 0,
          message: response.message,  // Direct pass — contains role + content
          finish_reason: response.finish_reason || "stop",
        },
      ],
      usage: response.usage || {},  // Already at top level in Puter response
    });
  } catch (error) {
    console.error("Error in /v1/chat/completions:", error.message);
    res.status(500).json({
      error: error.message,
      type: "internal_error",
    });
  }
});

// Anthropic-compatible endpoint (keep your existing code or leave as-is)
app.post("/v1/messages", async (req, res) => {
  // (keep your existing code)
});

// Raw Puter endpoint (keep your existing code or leave as-is)
app.post("/chat", async (req, res) => {
  // (keep your existing code)
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Puter proxy server running on http://localhost:${PORT}`);
  console.log("Available routes:");
  console.log("  POST /chat                  → Raw Puter response");
  console.log("  POST /v1/chat/completions   → OpenAI-compatible");
  console.log("  POST /v1/messages           → Anthropic-compatible");
});