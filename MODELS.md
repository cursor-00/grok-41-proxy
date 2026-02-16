# Puter Proxy - Complete Model Guide

## Available Models (TESTED & WORKING)

### ✅ Working Models (18 total)

| Model | Type | Status |
|-------|------|--------|
| **deepseek-chat** | Reasoning | ✓ Working |
| **gpt-5-chat** | OpenAI | ✓ Working |
| **gpt-4o** | OpenAI | ✓ Working |
| **gpt-4o-mini** | OpenAI | ✓ Working |
| **gemini-2.0-flash** | Google | ✓ Working |
| **gemini-2.0-flash-lite** | Google | ✓ Working |
| **claude-opus-4-5-latest** | Claude | ✓ Working |
| **claude-sonnet-4** | Claude | ✓ Working |
| **claude-haiku-4-5** | Claude | ✓ Working |
| **grok-3** | xAI | ✓ Working |
| **grok-3-fast** | xAI | ✓ Working |
| **grok-2-vision** | xAI | ✓ Working |
| **mistral-large-2512** | Mistral | ✓ Working |
| **mistral-small-2506** | Mistral | ✓ Working |
| **mistral-medium-2508** | Mistral | ✓ Working |
| **codestral-2508** | Code | ✓ Working |
| **devstral-medium-2507** | Code | ✓ Working |
| **qwen-2.5-coder-32b-instruct** | Code | ✓ Working |

### ❌ NOT Working (do not use)
- auto (undefined)
- deepseek-reasoner
- gpt-5-nano
- o1 / o3 / o3-mini
- gemini-2.5-pro / gemini-2.5-flash
- claude-3-5-sonnet
- claude-sonnet-4-5-latest
- claude-haiku-3-5-2025
- grok-2

## Auto-Routing Logic

The router automatically selects the best model based on your query:

| Query Type | Model | Keywords |
|------------|-------|----------|
| **BUILDING** | claude-opus-4-5-latest | code, implement, function, class, api, debug, fix, refactor, sql, database, frontend, backend, deploy, docker, write a, create a, build, develop |
| **PLANNING** | deepseek-chat | plan, design, architecture, structure, strategy, analyze, compare, decision, recommend, evaluate, assessment, overview, roadmap, approach, diagram, flow, system design |
| **REASONING** | gpt-4o | reason, solve, explain, how does, why is, what is, step by step, proof, calculate, derive, think about |
| **FAST** | gpt-4o-mini | Simple questions |
| **DEFAULT** | deepseek-chat | Everything else |

## Usage Examples

### OpenAI-Compatible API
```bash
curl -X POST http://localhost:3333/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Write a Python function"}],
    "model": "claude-opus-4-5-latest",
    "stream": false
  }'
```

### Anthropic-Compatible API
```bash
curl -X POST http://localhost:3333/v1/messages \
  -H "Content-Type: application/json" \
  -H "Anthropic-Api-Version: 2023-06-01" \
  -d '{
    "messages": [{"role": "user", "content": "Design a system"}],
    "model": "claude-opus-4-5-latest"
  }'
```

### Auto-Routing Endpoint
```bash
# Automatically routes to best model
curl -X POST http://localhost:3333/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Build a REST API"}]
  }'
```

## OpenCode Configuration

Edit `/home/mulky/opencode.json`:

```json
{
  "provider": {
    "puter-proxy": {
      "models": {
        "deepseek-chat": {},
        "gpt-5-chat": {},
        "gpt-4o": {},
        "gpt-4o-mini": {},
        "gemini-2.0-flash": {},
        "claude-opus-4-5-latest": {},
        "claude-sonnet-4": {},
        "claude-haiku-4-5": {},
        "grok-3": {},
        "mistral-large-2512": {},
        "codestral-2508": {},
        "qwen-2.5-coder-32b-instruct": {}
      },
      "options": {
        "baseURL": "http://localhost:3333/v1"
      }
    }
  }
}
```

## Testing All Endpoints

```bash
# Test OpenAI endpoint
curl -X POST http://localhost:3333/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hi"}],"model":"deepseek-chat","stream":false}'

# Test Anthropic endpoint
curl -X POST http://localhost:3333/v1/messages \
  -H "Content-Type: application/json" \
  -H "Anthropic-Api-Version: 2023-06-01" \
  -d '{"messages":[{"role":"user","content":"Hi"}],"model":"claude-opus-4-5-latest"}'

# Test auto-routing
curl -X POST http://localhost:3333/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Write a Python script"}]}'
```

## Commands

```bash
# Status
sudo systemctl status puter-proxy

# Restart
sudo systemctl restart puter-proxy

# Logs
sudo journalctl -u puter-proxy -f
```

## Troubleshooting

**Service Status:**
```bash
sudo systemctl status puter-proxy
sudo systemctl restart puter-proxy
sudo journalctl -u puter-proxy -f
```

**Common Errors:**
- 401: Missing auth token (check PUTER_AUTH_TOKEN)
- 404: Wrong endpoint (use /v1/chat/completions or /v1/messages)
- 500: Server error (check logs with journalctl)
