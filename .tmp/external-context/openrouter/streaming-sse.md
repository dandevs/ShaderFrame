---
source: Official Docs (openrouter.ai)
library: OpenRouter
package: openrouter
topic: Streaming Responses (SSE Format)
fetched: 2026-02-22T00:00:00Z
official_docs: https://openrouter.ai/docs/api/reference/streaming
---

# Streaming Responses (Server-Sent Events)

OpenRouter supports streaming responses from **any model** via SSE. Set `stream: true` in your request body.

---

## Enabling Streaming

Add `"stream": true` to the request body:

```json
{
  "model": "openai/gpt-5.2",
  "messages": [{ "role": "user", "content": "Hello!" }],
  "stream": true
}
```

---

## SSE Format

Each chunk is a Server-Sent Event line:

```
data: {"id":"gen-xxx","object":"chat.completion.chunk","created":1234567890,"model":"openai/gpt-5.2","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"gen-xxx","object":"chat.completion.chunk","created":1234567890,"model":"openai/gpt-5.2","choices":[{"index":0,"delta":{"content":" there"},"finish_reason":null}]}

data: [DONE]
```

### Key Points

- Each line starts with `data: ` prefix
- Content is in `choices[0].delta.content`
- Final chunk has `finish_reason` set (e.g., `"stop"`)
- Stream ends with `data: [DONE]`
- **Usage stats** are returned exactly once in the final chunk before `[DONE]`, with an empty `choices` array

### Keep-Alive Comments

OpenRouter occasionally sends comments to prevent connection timeouts:

```
: OPENROUTER PROCESSING
```

These should be **safely ignored** per the SSE spec. Some SSE client implementations may not handle these correctly, which can cause `JSON.parse` errors.

---

## TypeScript Implementation (OpenRouter SDK)

```typescript
import { OpenRouter } from '@openrouter/sdk'

const openRouter = new OpenRouter({ apiKey: '<OPENROUTER_API_KEY>' })

const stream = await openRouter.chat.send({
  model: 'openai/gpt-5.2',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
})

for await (const chunk of stream) {
  const content = chunk.choices?.[0]?.delta?.content
  if (content) {
    process.stdout.write(content)
  }

  // Final chunk includes usage stats
  if (chunk.usage) {
    console.log('Usage:', chunk.usage)
  }
}
```

## TypeScript Implementation (fetch)

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-5.2',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true
  })
})

const reader = response.body?.getReader()
if (!reader) throw new Error('Response body is not readable')

const decoder = new TextDecoder()
let buffer = ''

try {
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    while (true) {
      const lineEnd = buffer.indexOf('\n')
      if (lineEnd === -1) break

      const line = buffer.slice(0, lineEnd).trim()
      buffer = buffer.slice(lineEnd + 1)

      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') break

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices[0].delta.content
          if (content) {
            process.stdout.write(content)
          }
        } catch (e) {
          // Ignore invalid JSON (e.g., keep-alive comments)
        }
      }
    }
  }
} finally {
  reader.cancel()
}
```

## Python Implementation

```python
import requests
import json

response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": "openai/gpt-5.2",
        "messages": [{"role": "user", "content": "Hello!"}],
        "stream": True
    },
    stream=True
)

buffer = ""
for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
    buffer += chunk
    while True:
        line_end = buffer.find('\n')
        if line_end == -1:
            break

        line = buffer[:line_end].strip()
        buffer = buffer[line_end + 1:]

        if line.startswith('data: '):
            data = line[6:]
            if data == '[DONE]':
                break

            try:
                data_obj = json.loads(data)
                content = data_obj["choices"][0]["delta"].get("content")
                if content:
                    print(content, end="", flush=True)
            except json.JSONDecodeError:
                pass
```

---

## Stream Cancellation

Streaming requests can be cancelled by aborting the connection. For supported providers, this **immediately stops model processing and billing**.

### TypeScript (AbortController)

```typescript
const controller = new AbortController()

const stream = await openRouter.chat.send(
  {
    model: 'openai/gpt-5.2',
    messages: [{ role: 'user', content: 'Write a story' }],
    stream: true
  },
  {
    signal: controller.signal
  }
)

// To cancel:
controller.abort()
```

### Supported Providers for Cancellation

**Supported**: OpenAI, Azure, Anthropic, Fireworks, DeepSeek, DeepInfra, Together, Cohere, XAI, Cloudflare, and others.

**Not Currently Supported**: AWS Bedrock, Groq, Google, Google AI Studio, Mistral, HuggingFace, Replicate, Perplexity, and others.

> **Warning**: Cancellation only works for streaming requests with supported providers. For non-streaming requests or unsupported providers, the model will continue processing and you will be billed for the complete response.

---

## Handling Errors During Streaming

### Pre-Stream Errors

Errors before any tokens are sent return a standard JSON error with appropriate HTTP status code:

```json
{
  "error": {
    "code": 400,
    "message": "Invalid model specified"
  }
}
```

### Mid-Stream Errors

Errors after tokens have been streamed cannot change the HTTP status (already 200). Instead, the error is sent as an SSE event:

```
data: {"id":"cmpl-abc123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-3.5-turbo","provider":"openai","error":{"code":"server_error","message":"Provider disconnected unexpectedly"},"choices":[{"index":0,"delta":{"content":""},"finish_reason":"error"}]}
```

Key characteristics:

- Error appears at the **top level** alongside standard fields
- `choices` array included with `finish_reason: "error"`
- HTTP status remains 200 OK
- Stream is terminated after this event

### Error Handling Example

```typescript
for await (const chunk of stream) {
  // Check for mid-stream errors
  if ('error' in chunk) {
    console.error(`Stream error: ${chunk.error.message}`)
    if (chunk.choices?.[0]?.finish_reason === 'error') {
      console.log('Stream terminated due to error')
    }
    return
  }

  // Process normal content
  const content = chunk.choices?.[0]?.delta?.content
  if (content) {
    process.stdout.write(content)
  }
}
```
