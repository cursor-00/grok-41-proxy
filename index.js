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

// ────────────────────────────────────────────────
// TEMPORARY DEBUG LOGGING (as you requested)
// Shows every request Accomplish sends
// ────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.originalUrl);
  next();
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Model Routing Function
function routeModel(model) {
  const m = (model || "").toLowerCase();

  if (m.includes("5.1") && m.includes("max")) return "anthropic/claude-opus-4-6";
  if (m.includes("5.1") && m.includes("mini")) return "x-ai/grok-4-1-fast";
  if (m.includes("5.2")) return "anthropic/claude-opus-4-6";
  if (m.includes("nano")) return "anthropic/claude-opus-4-6";

  return "anthropic/claude-opus-4-6";
}

// HEALTH CHECK + other routes (unchanged from last version)
app.get("/", (req, res) => { /* same as before */ });
app.get("/v1/models", (req, res) => { /* same as before */ });
app.get("/models", (req, res) => { /* same as before */ });

// ... (your extractContent function + all POST routes remain exactly the same)

app.post("/v1/chat/completions", async (req, res) => { /* your current version */ });
app.post("/v1/responses", async (req, res) => { /* your current version */ });
app.post("/v1/messages", async (req, res) => { /* your current version */ });
app.post("/chat", async (req, res) => { /* your current version */ });

// Start server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Puter proxy running on http://localhost:${PORT}`);
  console.log(`✅ Logging enabled — check Render logs for every request from Accomplish`);
});
