# Services — Agent Guidelines

Service layer for external integrations. Currently contains AI provider abstraction.

## AI Service (`ai/`)

### Architecture

- **Provider abstraction**: `AIProvider` interface in `types/ai.ts` defines the contract
- **Factory function**: `createAIProvider(type, config)` in `index.ts`
- **OpenRouter implementation**: `OpenRouterProvider` in `openrouter-provider.ts`
- **Prompt engineering**: `buildShaderSystemPrompt()` and `buildShaderUserPrompt()` in `shader-prompt.ts`

### OpenRouter Provider

- OpenAI-compatible API: `POST https://openrouter.ai/api/v1/chat/completions`
- Bearer token auth from Electron safeStorage
- SSE streaming: parses `data:` lines, ignores keep-alive comments (`: OPENROUTER PROCESSING`)
- Terminates on `data: [DONE]`
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Default model: `anthropic/claude-sonnet-4` (configurable via `AIProviderConfig`)

### Shader Prompt Engineering

- System prompt instructs the AI to output structured JSON containing:
  - `name`: Human-readable shader name
  - `vertexShader`: GLSL vertex shader (passthrough)
  - `fragmentShader`: GLSL fragment shader
  - `uniforms`: Array of typed uniform declarations with display names, types, defaults, and ranges
- Supported uniform types: `float`, `vec2`, `vec3`, `vec4`, `color`, `bool`, `enum`, `texture`
- Context includes: image count, child layer names, existing shader (for edits), previous prompt

### Adding a New Provider

1. Create `new-provider.ts` implementing `AIProvider` interface
2. Add provider type to `AIProviderType` union in `index.ts`
3. Add case to `createAIProvider()` switch statement
4. No other changes needed — factory pattern handles the rest

### Usage

```tsx
const provider = createAIProvider('openrouter', { apiKey, model })
const result = await provider.generateShaderStream(prompt, context, onChunk)
if (result.success && result.shader) {
  // result.shader has: name, vertexShader, fragmentShader, uniforms
}
```

## Don'ts

- Don't call OpenRouter directly — always go through the provider abstraction
- Don't store API keys in code or environment variables — use Electron safeStorage
- Don't skip error handling — network calls can fail in many ways
