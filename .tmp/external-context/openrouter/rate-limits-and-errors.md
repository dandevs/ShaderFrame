---
source: Official Docs (openrouter.ai)
library: OpenRouter
package: openrouter
topic: Rate Limiting and Error Handling
fetched: 2026-02-22T00:00:00Z
official_docs: https://openrouter.ai/docs/api/reference/limits
---

# Rate Limiting and Error Handling

## Rate Limits

Rate limits are governed **globally** per account (not per API key). Creating additional accounts or API keys will not affect rate limits.

### Free Model Limits

For models with `:free` variant:

- **Per-minute limit**: Configurable (see docs)
- **Per-day limit (< $5 credits purchased)**: Limited requests per day
- **Per-day limit (>= $5 credits purchased)**: Higher daily limit

### Paid Model Limits

- Different models have different rate limits
- You can spread load across different models to avoid limits
- **DDoS protection**: Cloudflare blocks requests that dramatically exceed reasonable usage

### Negative Credit Balance

If your account has a negative credit balance, you may see `402 Payment Required` errors, **including for free models**. Add credits to put your balance above zero.

### Checking Rate Limits

```
GET https://openrouter.ai/api/v1/key
Authorization: Bearer <OPENROUTER_API_KEY>
```

Response includes:

```typescript
{
  data: {
    limit: number | null,           // Credit limit (null = unlimited)
    limit_remaining: number | null, // Remaining credits (null = unlimited)
    usage: number,                  // All-time credits used
    usage_daily: number,            // Today's usage
    usage_weekly: number,
    usage_monthly: number,
    is_free_tier: boolean,          // Whether user has ever paid
  }
}
```

---

## Error Response Format

```typescript
type ErrorResponse = {
  error: {
    code: number
    message: string
    metadata?: Record<string, unknown>
  }
}
```

The HTTP status code matches `error.code` for pre-stream errors.

---

## Error Codes

| HTTP Status | Meaning             | Description                                                          |
| ----------- | ------------------- | -------------------------------------------------------------------- |
| **400**     | Bad Request         | Invalid or missing params, CORS issues                               |
| **401**     | Unauthorized        | Invalid credentials, expired OAuth session, disabled/invalid API key |
| **402**     | Payment Required    | Insufficient credits. Add more and retry.                            |
| **403**     | Forbidden           | Model requires moderation and input was flagged                      |
| **408**     | Request Timeout     | Request timed out                                                    |
| **429**     | Too Many Requests   | Rate limited                                                         |
| **502**     | Bad Gateway         | Model is down or invalid response from provider                      |
| **503**     | Service Unavailable | No available provider meets routing requirements                     |

---

## Error Metadata Types

### Moderation Errors (403)

```typescript
type ModerationErrorMetadata = {
  reasons: string[] // Why input was flagged
  flagged_input: string // Flagged text (truncated to 100 chars)
  provider_name: string
  model_slug: string
}
```

### Provider Errors (502)

```typescript
type ProviderErrorMetadata = {
  provider_name: string
  raw: unknown // Raw error from the provider
}
```

---

## Streaming Error Handling

### Pre-Stream Errors

Standard JSON response with appropriate HTTP status code:

```json
{
  "error": {
    "code": 400,
    "message": "Invalid model specified"
  }
}
```

### Mid-Stream Errors

After tokens have been sent (HTTP status already 200), errors arrive as SSE events:

```typescript
type MidStreamError = {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  provider: string
  error: {
    code: string | number
    message: string
  }
  choices: [
    {
      index: 0
      delta: { content: '' }
      finish_reason: 'error'
      native_finish_reason?: string
    }
  ]
}
```

Example SSE data:

```
data: {"id":"cmpl-abc123","object":"chat.completion.chunk","created":1234567890,"model":"gpt-3.5-turbo","provider":"openai","error":{"code":"server_error","message":"Provider disconnected"},"choices":[{"index":0,"delta":{"content":""},"finish_reason":"error"}]}
```

---

## When No Content Is Generated

Occasionally models may not generate content due to:

- Cold start warm-up (seconds to minutes)
- System scaling up for more requests

**Recommendations**:

- Implement a retry mechanism
- Try a different provider or model
- Note: You may still be charged for prompt processing even if no content is generated

---

## Debugging

Enable debug output (streaming only) to see the exact request sent to the provider:

```json
{
  "model": "anthropic/claude-haiku-4.5",
  "stream": true,
  "messages": [{ "role": "user", "content": "Hello!" }],
  "debug": {
    "echo_upstream_body": true
  }
}
```

The first SSE chunk will contain a `debug` field with the transformed request body:

```json
{
  "id": "gen-xxxxx",
  "provider": "Anthropic",
  "model": "anthropic/claude-haiku-4.5",
  "choices": [],
  "debug": {
    "echo_upstream_body": {
      "system": [{ "type": "text", "text": "You are a helpful assistant." }],
      "messages": [{ "role": "user", "content": "Hello!" }],
      "model": "claude-haiku-4-5-20251001",
      "stream": true,
      "max_tokens": 64000,
      "temperature": 1
    }
  }
}
```

> **Warning**: Debug mode is for development only. Do not use in production.

---

## Recommended Error Handling Pattern

```typescript
async function callOpenRouter(messages: Message[]) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-5.2',
      messages
    })
  })

  // Check for pre-response errors
  if (!response.ok) {
    const error = await response.json()
    switch (error.error.code) {
      case 401:
        throw new Error('Invalid API key')
      case 402:
        throw new Error('Insufficient credits')
      case 429:
        throw new Error('Rate limited - retry after backoff')
      case 502:
        throw new Error('Provider error - try different model')
      case 503:
        throw new Error('No provider available')
      default:
        throw new Error(error.error.message)
    }
  }

  const data = await response.json()

  // Check for errors in the response body
  if (data.error) {
    throw new Error(data.error.message)
  }

  return data
}
```
