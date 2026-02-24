The Real Fix (Streaming Pass-Through Correctly)

Replace your streaming block with this:

if (stream) {
  if (!providerRes.ok) {
    const errorText = await providerRes.text();
    return res.status(providerRes.status).send(errorText);
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const reader = providerRes.body.getReader();
  const encoder = new TextEncoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }

  res.end();
  return;
}

This properly handles Web Streams.

🧠 Why This Matters

AI SDK expects:

Content-Type: text/event-stream
data: {...}
data: {...}

If your proxy:

closes connection too early

sends wrong headers

buffers instead of streaming

pipes incorrectly

AI SDK throws generic:

API error (400)

Even though provider may be fine.

🔎 One More Critical Check

Add this log before forwarding:

console.log("Forward body:", JSON.stringify({
  model,
  messages,
  stream
}));

We need to confirm messages shape is:

[
  { "role": "user", "content": "hello" }
]

NOT:

[{ "role": "user", "content": [{ "type":"text","text":"hello"}] }]

Because Puter expects classic OpenAI Chat format.
