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

function normalizeInput(input) {
  if (!Array.isArray(input)) return [];

  return input.map(msg => {
    let role = msg.role || "user";
    if (role === "developer") role = "system";

    return {
      role,
      content: Array.isArray(msg.content)
        ? msg.content.map(c => c.text || c.output_text || "").join("")
        : msg.content
    };
  });
}

// Main handler — Force non-streaming for stability
async function handleResponses(req, res) {
  try {
    const { model, input, temperature, max_output_tokens } = req.body;

    console.log("Stream requested: true → Forced false for stability");

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
          model: "anthropic/claude-opus-4-6",
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: max_output_tokens ?? 4096,
          stream: false   // ← Forced non-streaming
        })
      }
    );

    if (!providerRes.ok) {
      const errorText = await providerRes.text();
      console.error("Provider error:", errorText);
      return res.status(providerRes.status).send(errorText);
    }

    const data = await providerRes.json();

    const contentText = data.choices?.[0]?.message?.content || "";

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
  console.log(`✅ Non-streaming mode + Claude Opus 4.6 + developer→system fix`);
});
