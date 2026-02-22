---
source: Official Docs (openrouter.ai)
library: OpenRouter
package: openrouter
topic: API Overview and Authentication
fetched: 2026-02-22T00:00:00Z
official_docs: https://openrouter.ai/docs/quickstart
---

# OpenRouter API Overview and Authentication

## Base URL

```
https://openrouter.ai/api/v1
```

OpenRouter is a **drop-in replacement for the OpenAI API**. The request/response schemas are normalized across all models and providers to comply with the OpenAI Chat API format.

## OpenAPI Specification

- **YAML**: https://openrouter.ai/openapi.yaml
- **JSON**: https://openrouter.ai/openapi.json

---

## Authentication

OpenRouter uses **Bearer token** authentication via API keys.

### Required Header

```
Authorization: Bearer <OPENROUTER_API_KEY>
```

### Optional Headers (App Attribution)

```
HTTP-Referer: <YOUR_SITE_URL>       # Site URL for rankings on openrouter.ai
X-Title: <YOUR_SITE_NAME>           # Site title for rankings on openrouter.ai
Content-Type: application/json
```

### Creating API Keys

1. Go to https://openrouter.ai/keys
2. Create a new key with an optional name and credit limit
3. Use the key as a Bearer token in the `Authorization` header

### Key Info Endpoint

Check rate limits and remaining credits:

```
GET https://openrouter.ai/api/v1/key
Authorization: Bearer <OPENROUTER_API_KEY>
```

Response shape:

```typescript
type Key = {
  data: {
    label: string
    limit: number | null // Credit limit for the key, or null if unlimited
    limit_reset: string | null // Type of limit reset, or null if never resets
    limit_remaining: number | null // Remaining credits, or null if unlimited
    include_byok_in_limit: boolean

    usage: number // Credits used (all time)
    usage_daily: number // Credits used (current UTC day)
    usage_weekly: number // Credits used (current UTC week, Monday start)
    usage_monthly: number // Credits used (current UTC month)

    byok_usage: number
    byok_usage_daily: number
    byok_usage_weekly: number
    byok_usage_monthly: number

    is_free_tier: boolean // Whether user has paid for credits before
  }
}
```

---

## SDK Options

### 1. OpenRouter SDK (Beta) - `@openrouter/sdk`

```bash
npm install @openrouter/sdk
# or: yarn add @openrouter/sdk
# or: pnpm add @openrouter/sdk
```

```typescript
import { OpenRouter } from '@openrouter/sdk'

const openRouter = new OpenRouter({
  apiKey: '<OPENROUTER_API_KEY>',
  defaultHeaders: {
    'HTTP-Referer': '<YOUR_SITE_URL>',
    'X-Title': '<YOUR_SITE_NAME>'
  }
})

const completion = await openRouter.chat.send({
  model: 'openai/gpt-5.2',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: false
})

console.log(completion.choices[0].message.content)
```

### 2. OpenAI SDK (Drop-in Replacement)

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '<OPENROUTER_API_KEY>',
  defaultHeaders: {
    'HTTP-Referer': '<YOUR_SITE_URL>',
    'X-Title': '<YOUR_SITE_NAME>'
  }
})

const completion = await openai.chat.completions.create({
  model: 'openai/gpt-5.2',
  messages: [{ role: 'user', content: 'Hello!' }]
})

console.log(completion.choices[0].message)
```

### 3. Direct API (fetch / curl)

```typescript
fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <OPENROUTER_API_KEY>',
    'HTTP-Referer': '<YOUR_SITE_URL>',
    'X-Title': '<YOUR_SITE_NAME>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-5.2',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
})
```

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
    "model": "openai/gpt-5.2",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### 4. Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="<OPENROUTER_API_KEY>",
)

completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>",
    "X-Title": "<YOUR_SITE_NAME>",
  },
  model="openai/gpt-5.2",
  messages=[{"role": "user", "content": "Hello!"}],
)

print(completion.choices[0].message.content)
```

### Recommended SSE Client Libraries

- [eventsource-parser](https://github.com/rexxars/eventsource-parser)
- [OpenAI SDK](https://www.npmjs.com/package/openai)
- [Vercel AI SDK](https://www.npmjs.com/package/ai)

### Security Note

API keys are GitHub secret scanning partners. If exposed, OpenRouter will notify you. Always use environment variables and never commit keys to repositories.
