# Puter.js Complete Capabilities

## AI Capabilities (puter.ai.*)

| Function | Description | Use Case |
|----------|-------------|----------|
| `puter.ai.chat()` | Chat with 500+ AI models | General conversation, code, analysis |
| `puter.ai.img2txt()` | OCR - Extract text from images | Read documents, screenshots |
| `puter.ai.speech2txt()` | Speech to text transcription | Transcribe audio, meetings |
| `puter.ai.speech2speech()` | Voice conversion (ElevenLabs) | Change voice in audio |
| `puter.ai.txt2speech()` | Text to speech (AWS Polly, OpenAI, ElevenLabs) | Generate audio from text |
| `puter.ai.txt2img()` | Image generation (DALL-E, GPT Image, Grok) | Create images from prompts |
| `puter.ai.txt2vid()` | Video generation | Create videos from text |
| `puter.ai.listModels()` | List all available models | Show available AI models |
| `puter.ai.listModelProviders()` | List all providers | Show available providers |

### Chat Features
- **Function Calling**: Define custom tools for AI to call
- **Web Search**: Built-in web search for OpenAI models
- **Image Analysis**: Analyze images with vision models
- **File Attachments**: Upload files for context
- **Streaming**: Real-time response streaming
- **Multimodal**: Text + images + files in one request

---

## File System (puter.fs.*)

| Function | Description | Use Case |
|----------|-------------|----------|
| `puter.fs.read()` | Read file content | Load files, configs |
| `puter.fs.write()` | Write/create file | Save files, generate code |
| `puter.fs.delete()` | Delete file/directory | Remove files |
| `puter.fs.copy()` | Copy file | Backup, duplicate |
| `puter.fs.move()` | Move file | Organize files |
| `puter.fs.rename()` | Rename file | Rename operations |
| `puter.fs.mkdir()` | Create directory | Create folders |
| `puter.fs.readdir()` | List directory contents | List files |
| `puter.fs.stat()` | Get file metadata | File info, permissions |
| `puter.fs.upload()` | Upload file | Upload to Puter cloud |
| `puter.fs.getReadURL()` | Get shareable URL | Share files |
| `puter.fs.space()` | Check storage usage | Monitor space |

---

## Storage (puter.kv.*)

| Function | Description | Use Case |
|----------|-------------|----------|
| `puter.kv.set()` | Store key-value pair | Cache, settings |
| `puter.kv.get()` | Retrieve value by key | Get cached data |
| `puter.kv.delete()` | Delete key-value pair | Remove stored data |
| `puter.kv.list()` | List all keys | List stored items |

---

## Network (puter.net.*)

| Function | Description | Use Case |
|----------|-------------|----------|
| `puter.net.fetch()` | HTTP requests | API calls, web scraping |
| `puter.net.download()` | Download files | Fetch files from URL |

---

## Authentication & User (puter.auth.*)

| Function | Description | Use Case |
|----------|-------------|----------|
| `puter.auth.signup()` | Create new account | User registration |
| `puter.auth.login()` | User login | Authentication |
| `puter.auth.logout()` | User logout | End session |
| `puter.getUser()` | Get current user info | User profile |
| `puter.perms.request()` | Request permission | Grant access |

---

## Apps & UI (puter.apps.*, puter.ui.*)

| Function | Description | Use Case |
|----------|-------------|----------|
| `puter.apps.list()` | List installed apps | App management |
| `puter.apps.launch()` | Launch an app | Open applications |
| `puter.ui.alert()` | Show alert dialog | Notifications |
| `puter.ui.prompt()` | Show prompt dialog | User input |
| `puter.ui.confirm()` | Show confirmation dialog | Yes/no questions |
| `puter.ui.openWindow()` | Open new window | Create windows |
| `puter.ui.closeWindow()` | Close window | Window management |

---

## Background Tasks (puter.work.*, puter.workers.*)

| Function | Description | Use Case |
|----------|-------------|----------|
| `puter.work.do()` | Queue background work | Async tasks |
| `puter.workers.create()` | Create worker thread | Parallel processing |
| `puter.workers.post()` | Send message to worker | Worker communication |

---

## Other Utilities

| Function | Description | Use Case |
|----------|-------------|----------|
| `puter.print()` | Print to console | Debug output |
| `puter.randName()` | Generate random name | Unique identifiers |
| `puter.env.get()` | Get environment variable | Config access |
| `puter.site.get()` | Get current site info | Site metadata |
| `puter.hosting.upload()` | Upload for hosting | Deploy static sites |
| `puter.drivers.list()` | List system drivers | System info |

---

## OpenCode Integration Potential

### Currently Used
```javascript
puter.ai.chat() - Chat completions ✅
```

### Could Be Used For

| Feature | Puter.js API | Potential Use |
|---------|--------------|---------------|
| Image Analysis | `puter.ai.img2txt()` | OCR for reading files |
| File Operations | `puter.fs.*` | File management tools |
| Storage | `puter.kv.*` | Persistent storage |
| Voice | `puter.ai.txt2speech()` | Text-to-speech |
| Transcription | `puter.ai.speech2txt()` | Audio transcription |
| Code Execution | Function Calling | Run code in sandbox |
| Web Search | `tools: [{type: "web_search"}]` | Live web access |

---

## Example: Function Calling

```javascript
const tools = [{
  type: "function",
  function: {
    name: "get_weather",
    description: "Get current weather",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" }
      },
      required: ["location"]
    }
  }
}];

const response = await puter.ai.chat(
  "What's the weather in Tokyo?",
  { tools }
);

// If AI wants to call the function
if (response.message.tool_calls) {
  const toolCall = response.message.tool_calls[0];
  const args = JSON.parse(toolCall.function.arguments);
  const weather = getWeather(args.location);
  
  // Send result back
  const final = await puter.ai.chat([
    { role: "user", content: "What's the weather in Tokyo?" },
    response.message,
    { role: "tool", tool_call_id: toolCall.id, content: weather }
  ]);
}
```

---

## Example: File Operations

```javascript
// Write file
await puter.fs.write("~/test.txt", "Hello World!");

// Read file  
const content = await puter.fs.read("~/test.txt");

// List directory
const files = await puter.fs.readdir("~/");

// Upload file
await puter.fs.upload(file, "/public/myfile.txt");
```

---

## Example: Image Analysis

```javascript
const response = await puter.ai.chat(
  "What do you see in this image?",
  "https://example.com/image.jpg",
  { model: "gpt-5-nano" }
);
```

---

## Resources

- Docs: https://docs.puter.com/
- API Reference: https://docs.puter.com/llms.txt
- Models: https://developer.puter.com/ai/models/
