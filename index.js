import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, ".env") });

if (!process.env.PUTER_AUTH_TOKEN) {
  throw new Error("PUTER_AUTH_TOKEN is not set in .env");
}

const PUTER_TOKEN = process.env.PUTER_AUTH_TOKEN;

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(200);

  console.log("Incoming:", req.method, req.originalUrl);
  next();
});

app.use(express.json({ limit: "50mb" }));

// Model list for Accomplish
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

// ────────────────────────────────────────────────
// New Model Normalization (as you requested)
// ────────────────────────────────────────────────
function normalizeModel(model) {
  if (!model || typeof model !== "string") {
    return "openai/gpt-5-nano";
  }

  const m = model.toLowerCase();

  if (m.includes("5.1") && m.includes("codex") && m.includes("max")) {
    return "openai/gpt-5.1-codex-max";
  }

  if (m.includes("5.1") && m.includes("codex") && m.includes("mini")) {
    return "openai/gpt-5.1-codex-mini";
  }

  if (m.includes("5.2")) {
    return "openai/gpt-5.2";
  }

  if (m.includes("nano")) {
    return "openai/gpt-5-nano";
  }

  return "openai/gpt-5-nano";
}

function normalizeInput(input) {
  if (Array.isArray(input)) {
    return input.map(msg => ({
      role: msg.role || "user",
      content: Array.isArray(msg.content)
        ? msg.content.map(c => c.text || c.output_text || "").join("")
        : msg.content
    }));
  }

  if (typeof input === "string") {
    return [{ role: "user", content: input }];
  }

  return [];
}

// ────────────────────────────────────────────────
// Reusable Responses Handler
// ────────────────────────────────────────────────
async function handleResponses(req, res) {
  try {
    const { model, input, temperature, max_output_tokens, stream } = req.body;

    console.log("Stream requested:", !!stream);

    if (!model) {
      return res.status(400).json({
        error: { message: "Model is required", type: "invalid_request_error" }
      });
    }

    const requestedModel = normalizeModel(model);   // ← Your new normalization
    console.log(`[Model] ${model} → ${requestedModel}`);

    const messages = normalizeInput(input);

    if (!messages.length) {
      return res.status(400).json({
        error: { message: "No valid input", type: "invalid_request_error" }
      });
    }

    const providerRes = await fetch(
      "https://api.puter.com/puterai/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PUTER_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: requestedModel,        // ← Use normalized model
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: max_output_tokens ?? 4096,
          stream: !!stream
        })
      }
    );

    if (!providerRes.ok) {
      const errorText = await providerRes.text();
      return res.status(providerRes.status).send(errorText);
    }

    // STREAMING
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      providerRes.body.pipe(res);
      return;
    }

    // Non-stream
    const data = await providerRes.json();

    if (!data.choices?.length) {
      return res.status(500).json({
        error: { message: "Invalid provider response", type: "provider_error" }
      });
    }

    const contentText = data.choices[0].message.content;

    res.json({
      id: `resp_${Date.now().toString(36)}`,
      object: "response",
      created: Math.floor(Date.now() / 1000),
      model,                                 // return original model name to Accomplish
      output: [
        {
          id: `msg_${Date.now().toString(36)}`,
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: contentText }]
        }
      ],
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0
      }
    });

  } catch (err) {
    console.error("FULL ERROR in /responses:", err);
    res.status(500).json({
      error: { message: err.message || "Internal error", type: "internal_error" }
    });
  }
}

// Support both routes
app.post("/responses", handleResponses);
app.post("/v1/responses", handleResponses);

// Model list
app.get("/v1/models", (req, res) => res.json(openaiModelList));
app.get("/models", (req, res) => res.json(openaiModelList));

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 Puter proxy running on port ${PORT}`);
});
