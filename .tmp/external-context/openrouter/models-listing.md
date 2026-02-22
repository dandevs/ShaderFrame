---
source: Official Docs (openrouter.ai)
library: OpenRouter
package: openrouter
topic: Models Listing API and Model Selection
fetched: 2026-02-22T00:00:00Z
official_docs: https://openrouter.ai/docs/api/api-reference/models/get-models
---

# Models Listing API and Model Selection

## List All Models

```
GET https://openrouter.ai/api/v1/models
```

No authentication required. Returns all available models and their properties.

### Query Parameters

| Parameter              | Type   | Description                   |
| ---------------------- | ------ | ----------------------------- |
| `category`             | string | Filter by use case category   |
| `supported_parameters` | string | Filter by supported parameter |

### Category Values

`programming`, `roleplay`, `marketing`, `marketing/seo`, `technology`, `science`, `translation`, `legal`, `finance`, `health`, `trivia`, `academia`

### Example Request

```typescript
const response = await fetch('https://openrouter.ai/api/v1/models')
const data = await response.json()
// data.data is an array of Model objects
```

```python
import requests

response = requests.get("https://openrouter.ai/api/v1/models")
models = response.json()["data"]
```

---

## Response Schema

```typescript
type ModelsListResponse = {
  data: Model[]
}

type Model = {
  id: string // e.g. "openai/gpt-5.2", "anthropic/claude-haiku-4.5"
  canonical_slug: string
  hugging_face_id: string | null
  name: string // Display name
  created: number // Unix timestamp
  description: string
  pricing: PublicPricing
  context_length: number | null // Maximum context length in tokens
  architecture: ModelArchitecture
  top_provider: TopProviderInfo
  per_request_limits: PerRequestLimits
  supported_parameters: Parameter[]
  default_parameters: DefaultParameters
  expiration_date: string | null // ISO 8601 date (YYYY-MM-DD) or null
}

type PublicPricing = {
  prompt: object // Price per token for prompts
  completion: object // Price per token for completions
  request?: object // Per-request pricing
  image?: object // Image input pricing
  image_token?: object
  image_output?: object
  audio?: object
  audio_output?: object
  web_search?: object
  internal_reasoning?: object
  input_cache_read?: object
  input_cache_write?: object
  discount?: number
}

type ModelArchitecture = {
  tokenizer: ModelGroup
  instruct_type: string | null
  modality: string | null
  input_modalities: InputModality[] // "text" | "image" | "file" | "audio" | "video"
  output_modalities: OutputModality[] // "text" | "image" | "embeddings" | "audio"
}

type TopProviderInfo = {
  context_length: number | null
  max_completion_tokens: number | null
  is_moderated: boolean
}

type PerRequestLimits = {
  prompt_tokens: number // Maximum prompt tokens per request
  completion_tokens: number // Maximum completion tokens per request
}

type Parameter =
  | 'temperature'
  | 'top_p'
  | 'top_k'
  | 'min_p'
  | 'top_a'
  | 'frequency_penalty'
  | 'presence_penalty'
  | 'repetition_penalty'
  | 'max_tokens'
  | 'logit_bias'
  | 'logprobs'
  | 'top_logprobs'
  | 'seed'
  | 'response_format'
  | 'structured_outputs'
  | 'stop'
  | 'tools'
  | 'tool_choice'
  | 'parallel_tool_calls'
  | 'include_reasoning'
  | 'reasoning'
  | 'reasoning_effort'
  | 'web_search_options'
  | 'verbosity'
```

---

## Model ID Format

Models use the format: `provider/model-name`

Examples:

- `openai/gpt-5.2`
- `anthropic/claude-haiku-4.5`
- `google/gemini-2.5-pro`
- `meta-llama/llama-4-maverick`
- `deepseek/deepseek-r1`

### Model Groups (Tokenizer Families)

`Router`, `Media`, `Other`, `GPT`, `Claude`, `Gemini`, `Grok`, `Cohere`, `Nova`, `Qwen`, `Yi`, `DeepSeek`, `Mistral`, `Llama2`, `Llama3`, `Llama4`, `PaLM`, `RWKV`, `Qwen3`

---

## Model Variants

Append a suffix to the model slug to change its behavior:

### Static Variants (model-specific)

| Variant     | Description                                    |
| ----------- | ---------------------------------------------- |
| `:free`     | Free tier with low rate limits                 |
| `:extended` | Longer than usual context length               |
| `:exacto`   | Only OpenRouter-curated high-quality endpoints |
| `:thinking` | Reasoning/thinking mode enabled by default     |

### Dynamic Variants (all models)

| Variant   | Description                                     |
| --------- | ----------------------------------------------- |
| `:online` | Attaches web search results to the prompt       |
| `:nitro`  | Sorted by throughput for faster response times  |
| `:floor`  | Sorted by price for most cost-effective options |

Example: `openai/gpt-5.2:free`, `anthropic/claude-haiku-4.5:nitro`

---

## Model Routing

### Fallback Routing

Specify multiple models for automatic fallback:

```json
{
  "models": ["openai/gpt-5.2", "anthropic/claude-haiku-4.5", "google/gemini-2.5-pro"],
  "route": "fallback"
}
```

### Auto-Router

Use `openrouter/auto` to let OpenRouter pick the best model automatically.

### Free Models Router

Use `openrouter/free` to automatically select a free model.

### Browse Models

- **Web**: https://openrouter.ai/models
- **API**: https://openrouter.ai/api/v1/models
- **By capability**: https://openrouter.ai/models?supported_parameters=tools
- **Free models**: https://openrouter.ai/models?max_price=0
