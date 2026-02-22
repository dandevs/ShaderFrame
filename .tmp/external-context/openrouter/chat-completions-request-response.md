---
source: Official Docs (openrouter.ai)
library: OpenRouter
package: openrouter
topic: Chat Completions Request and Response Format
fetched: 2026-02-22T00:00:00Z
official_docs: https://openrouter.ai/docs/api/reference/overview
---

# Chat Completions API - Request & Response Format

## Endpoint

```
POST https://openrouter.ai/api/v1/chat/completions
```

---

## Request Schema

```typescript
type Request = {
  // Either "messages" or "prompt" is required
  messages?: Message[]
  prompt?: string

  // Model selection - uses "provider/model-name" format
  // If omitted, uses the user's default model
  model?: string

  // Response format (structured outputs)
  response_format?: ResponseFormat

  stop?: string | string[]
  stream?: boolean // Enable streaming (SSE)

  // Plugins to extend model capabilities
  plugins?: Plugin[]

  // LLM Parameters
  max_tokens?: number // Range: [1, context_length)
  temperature?: number // Range: [0, 2]

  // Tool calling
  tools?: Tool[]
  tool_choice?: ToolChoice

  // Advanced parameters
  seed?: number // Integer only
  top_p?: number // Range: (0, 1]
  top_k?: number // Range: [1, Infinity) - Not available for OpenAI models
  frequency_penalty?: number // Range: [-2, 2]
  presence_penalty?: number // Range: [-2, 2]
  repetition_penalty?: number // Range: (0, 2]
  logit_bias?: { [key: number]: number }
  top_logprobs?: number // Integer only
  min_p?: number // Range: [0, 1]
  top_a?: number // Range: [0, 1]

  // Predicted output for latency optimization
  prediction?: { type: 'content'; content: string }

  // OpenRouter-only parameters
  transforms?: string[] // Prompt transforms
  models?: string[] // Model routing - list of fallback models
  route?: 'fallback' // Enable fallback routing
  provider?: ProviderPreferences // Provider routing preferences
  user?: string // Stable end-user identifier (abuse detection)

  // Debug options (streaming only)
  debug?: {
    echo_upstream_body?: boolean // Returns the transformed request body sent to provider
  }
}
```

### Message Types

```typescript
type TextContent = {
  type: 'text'
  text: string
}

type ImageContentPart = {
  type: 'image_url'
  image_url: {
    url: string // URL or base64 encoded image data
    detail?: string // Optional, defaults to "auto"
  }
}

type ContentPart = TextContent | ImageContentPart

type Message =
  | {
      role: 'user' | 'assistant' | 'system'
      content: string | ContentPart[] // ContentParts only for "user" role
      name?: string // Prepended as "{name}: {content}" for non-OpenAI models
    }
  | {
      role: 'tool'
      content: string
      tool_call_id: string
      name?: string
    }
```

### Tool Calling

```typescript
type FunctionDescription = {
  description?: string
  name: string
  parameters: object // JSON Schema object
}

type Tool = {
  type: 'function'
  function: FunctionDescription
}

type ToolChoice = 'none' | 'auto' | { type: 'function'; function: { name: string } }
```

### Structured Outputs (Response Format)

```typescript
type ResponseFormat =
  | { type: 'json_object' } // Basic JSON mode
  | {
      type: 'json_schema'
      json_schema: {
        name: string
        strict?: boolean
        schema: object // JSON Schema object
      }
    }
```

### Plugins

```json
{
  "plugins": [
    { "id": "web" }, // Real-time web search
    { "id": "file-parser" }, // PDF processing
    { "id": "response-healing" } // Automatic JSON repair
  ]
}
```

### Assistant Prefill

Include a trailing assistant message to guide the model's response:

```json
{
  "messages": [
    { "role": "user", "content": "What is the meaning of life?" },
    { "role": "assistant", "content": "I'm not sure, but my best guess is" }
  ]
}
```

---

## Response Schema

```typescript
type Response = {
  id: string
  choices: (NonStreamingChoice | StreamingChoice | NonChatChoice)[]
  created: number // Unix timestamp
  model: string // e.g. "openai/gpt-3.5-turbo"
  object: 'chat.completion' | 'chat.completion.chunk'
  system_fingerprint?: string

  // Usage data: always returned for non-streaming.
  // For streaming: returned exactly once in the final chunk (with empty choices array)
  usage?: ResponseUsage
}

type ResponseUsage = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number

  prompt_tokens_details?: {
    cached_tokens: number
    cache_write_tokens?: number
    audio_tokens?: number
    video_tokens?: number
  }

  completion_tokens_details?: {
    reasoning_tokens?: number
    image_tokens?: number
  }

  cost?: number // Cost in credits
  is_byok?: boolean // Whether request used Bring Your Own Key

  cost_details?: {
    upstream_inference_cost?: number
    upstream_inference_prompt_cost: number
    upstream_inference_completions_cost: number
  }

  server_tool_use?: {
    web_search_requests?: number
  }
}
```

### Choice Types

```typescript
type NonStreamingChoice = {
  finish_reason: string | null // Normalized: "tool_calls" | "stop" | "length" | "content_filter" | "error"
  native_finish_reason: string | null // Raw from provider
  message: {
    content: string | null
    role: string
    tool_calls?: ToolCall[]
  }
  error?: ErrorResponse
}

type StreamingChoice = {
  finish_reason: string | null
  native_finish_reason: string | null
  delta: {
    content: string | null
    role?: string
    tool_calls?: ToolCall[]
  }
  error?: ErrorResponse
}
```

### Example Non-Streaming Response

```json
{
  "id": "gen-xxxxxxxxxxxxxx",
  "choices": [
    {
      "finish_reason": "stop",
      "native_finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "Hello there!"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 4,
    "total_tokens": 14,
    "prompt_tokens_details": { "cached_tokens": 0 },
    "completion_tokens_details": { "reasoning_tokens": 0 },
    "cost": 0.00014
  },
  "model": "openai/gpt-3.5-turbo"
}
```

### Querying Generation Stats

```typescript
const generation = await fetch('https://openrouter.ai/api/v1/generation?id=$GENERATION_ID', {
  headers: { Authorization: 'Bearer <OPENROUTER_API_KEY>' }
})
const stats = await generation.json()
```

---

## Important Notes

- **Model parameter format**: Always use `provider/model-name` format (e.g. `openai/gpt-5.2`, `anthropic/claude-haiku-4.5`)
- **Unsupported parameters are ignored**: If a model doesn't support a parameter (e.g., `top_k` for OpenAI), it is silently ignored
- **Multimodal support**: The API supports text, images (URL or base64), and PDFs
- **Automatic fallback**: OpenRouter automatically falls back to other providers on 5xx errors or rate limiting
