import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import { init } from "@heyputer/puter.js/src/init.cjs";
import { pickModel } from "./router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env') });

const puter = init(process.env.PUTER_AUTH_TOKEN);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

function extractContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(c => c.text || c).join("");
  return "";
}

app.post("/v1/messages", async (req, res) => {
  try {
    console.log("📨 Received /v1/messages request");
    let { messages, model, max_tokens, system } = req.body;
    model = model || "claude-opus-4-5-latest";
    
    let allMessages = [];
    if (system) allMessages.push({ role: "system", content: system });
    if (messages && Array.isArray(messages)) allMessages.push(...messages);
    if (allMessages.length === 0) allMessages.push({ role: "user", content: "" });
    
    console.log(`🤖 Calling Puter with model: ${model}`);
    const response = await puter.ai.chat(allMessages, {
      model: model,
      stream: false,
      max_tokens: max_tokens || 4096
    });
    
    const contentText = extractContent(response.message?.content);
    console.log(`✅ Response content: "${contentText.substring(0, 100)}..."`);
    
    res.json({
      id: response.message?.id || "msg_" + Date.now(),
      type: "message",
      role: "assistant",
      content: contentText ? [{ type: "text", text: contentText }] : [],
      model: model,
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 10 }
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message, type: "error" });
  }
});

const httpServer = http.createServer(app);
const httpsServer = https.createServer({
  key: fs.readFileSync('/tmp/key.pem'),
  cert: fs.readFileSync('/tmp/cert.pem')
}, app);

httpServer.listen(3333, () => console.log("HTTP:3333"));
httpsServer.listen(443, () => console.log("HTTPS:443"));
