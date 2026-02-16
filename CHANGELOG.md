# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-23

### Added
- Initial release of Puter.js Proxy Server
- Support for 18+ LLM models
- OpenAI-compatible API endpoint (`/v1/chat/completions`)
- Anthropic-compatible API endpoint (`/v1/messages`)
- Puter native auto-routing endpoint (`/chat`)
- Intelligent model selection based on query type
- Express.js server with proper middleware
- Dotenv configuration support
- Systemd service file for Linux
- Setup script for easy installation
- CLI tool for interactive chat
- Comprehensive documentation

### Features
- Free access to GPT-4o, Claude, DeepSeek, Gemini, Grok, Mistral, Qwen models
- No expensive API keys required
- Low latency responses
- Large payload support (50MB)
- Stream and non-streaming modes

### Models Supported
- ✅ deepseek-chat, gpt-5-chat, gpt-4o, gpt-4o-mini
- ✅ gemini-2.0-flash, gemini-2.0-flash-lite
- ✅ claude-opus-4-5-latest, claude-sonnet-4, claude-haiku-4-5
- ✅ grok-3, grok-3-fast, grok-2-vision
- ✅ mistral-large-2512, mistral-small-2506, mistral-medium-2508
- ✅ codestral-2508, devstral-medium-2507, qwen-2.5-coder-32b-instruct

### Auto-Routing
- BUILDING → claude-opus-4-5-latest (code, implement, debug, etc.)
- PLANNING → deepseek-chat (plan, design, strategy, etc.)
- REASONING → gpt-4o (solve, explain, calculate, etc.)
- FAST → gpt-4o-mini (simple queries)
- DEFAULT → deepseek-chat

### Files
- `index.js` - Main server
- `index-https.js` - HTTPS server with self-signed cert
- `index-debug.js` - Debug server with request logging
- `client.js` - Puter.js client with proper initialization
- `router.js` - Auto-routing logic
- `globals.js` - Browser polyfills
- `cli.mjs` - Interactive CLI chat tool
- `example.js` - Usage examples
- `setup.sh` - Installation script
- `start.sh` - Quick start script
- `puter-proxy.service` - Systemd service file
- `README.md` - Comprehensive documentation
- `MODELS.md` - Model guide and compatibility

### Security
- Environment variable support for sensitive data
- No API keys exposed in code
- Local processing only

### Compatibility
- Node.js 18+
- Express.js 5.x
- Puter.js SDK 2.2.5
- OpenAI SDK compatible
- Anthropic SDK compatible

---

## [0.0.1] - 2026-01-16

### Initial Development
- Proof of concept for Puter.js proxy
- Basic routing functionality
- Initial model testing
