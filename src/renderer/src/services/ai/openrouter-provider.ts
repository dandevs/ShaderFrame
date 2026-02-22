import type {
  AIProvider,
  AIProviderConfig,
  ShaderGenerationResult,
  AIStreamChunk,
  ShaderGenerationContext,
  AIMessage
} from '@renderer/types/ai'
import type { ParsedShaderResult, ShaderUniform, UniformType } from '@renderer/types/shader'
import { buildShaderSystemPrompt, buildShaderUserPrompt } from './shader-prompt'

const DEFAULT_MODEL = 'google/gemini-flash-3'
const DEFAULT_MAX_TOKENS = 4096
const DEFAULT_TEMPERATURE = 0.7

/** Retry configuration for exponential backoff */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 15000,
  /** HTTP status codes that are safe to retry (rate-limit, server errors) */
  retryableStatuses: new Set([429, 500, 502, 503, 504])
} as const

/** Wait for a given number of milliseconds */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Calculate exponential backoff delay with jitter */
function getBackoffDelay(attempt: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt)
  const jitter = Math.random() * RETRY_CONFIG.baseDelayMs
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelayMs)
}

/** Parse the AI response JSON into a ParsedShaderResult */
function parseShaderResponse(rawText: string): ParsedShaderResult {
  let jsonStr = rawText.trim()

  // Remove markdown code fences if the AI wraps the response
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  const parsed = JSON.parse(jsonStr) as {
    name: string
    vertexShader: string
    fragmentShader: string
    uniforms: Array<{
      name: string
      uniformName: string
      type: string
      value: unknown
      defaultValue?: unknown
      min?: number
      max?: number
      step?: number
      options?: string[]
      description?: string
    }>
  }

  // Validate required fields
  if (!parsed.name || !parsed.vertexShader || !parsed.fragmentShader) {
    throw new Error('Shader response missing required fields (name, vertexShader, fragmentShader)')
  }

  // Transform and validate uniforms
  const uniforms: ShaderUniform[] = (parsed.uniforms ?? []).map((u) => ({
    name: u.name,
    uniformName: u.uniformName,
    type: u.type as UniformType,
    value: u.value as ShaderUniform['value'],
    defaultValue: (u.defaultValue ?? u.value) as ShaderUniform['defaultValue'],
    min: u.min,
    max: u.max,
    step: u.step,
    options: u.options,
    description: u.description
  }))

  return {
    name: parsed.name,
    vertexShader: parsed.vertexShader,
    fragmentShader: parsed.fragmentShader,
    uniforms
  }
}

/** Determine whether a failed request should be retried */
function isRetryable(status: number): boolean {
  return RETRY_CONFIG.retryableStatuses.has(status)
}

export class OpenRouterProvider implements AIProvider {
  readonly name = 'OpenRouter'
  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = {
      baseUrl: config.baseUrl ?? 'https://openrouter.ai/api/v1',
      maxTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: config.temperature ?? DEFAULT_TEMPERATURE,
      apiKey: config.apiKey,
      model: config.model || DEFAULT_MODEL
    }
  }

  /** Build the standard request headers */
  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://shaderframe.app',
      'X-Title': 'ShaderFrame'
    }
  }

  /** Build the messages array for a shader generation request */
  private buildMessages(prompt: string, context?: ShaderGenerationContext): AIMessage[] {
    return [
      { role: 'system', content: buildShaderSystemPrompt() },
      { role: 'user', content: buildShaderUserPrompt(prompt, context) }
    ]
  }

  async generateShader(
    prompt: string,
    context?: ShaderGenerationContext
  ): Promise<ShaderGenerationResult> {
    const messages = this.buildMessages(prompt, context)

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            model: this.config.model,
            messages,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            stream: false
          })
        })

        if (!response.ok) {
          const errorBody = await response.text()

          // Retry on transient errors
          if (isRetryable(response.status) && attempt < RETRY_CONFIG.maxRetries) {
            await delay(getBackoffDelay(attempt))
            continue
          }

          return {
            success: false,
            error: `OpenRouter API error (${response.status}): ${errorBody}`,
            rawResponse: errorBody
          }
        }

        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>
        }

        const rawContent = data.choices[0]?.message?.content
        if (!rawContent) {
          return { success: false, error: 'No content in AI response' }
        }

        const shader = parseShaderResponse(rawContent)
        return { success: true, shader, rawResponse: rawContent }
      } catch (error) {
        // Retry on network errors
        if (attempt < RETRY_CONFIG.maxRetries) {
          await delay(getBackoffDelay(attempt))
          continue
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          rawResponse: undefined
        }
      }
    }

    // Should never reach here, but satisfy TypeScript
    return { success: false, error: 'Max retries exceeded' }
  }

  async generateShaderStream(
    prompt: string,
    context?: ShaderGenerationContext,
    onChunk?: (chunk: AIStreamChunk) => void
  ): Promise<ShaderGenerationResult> {
    const messages = this.buildMessages(prompt, context)

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            model: this.config.model,
            messages,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            stream: true
          })
        })

        if (!response.ok) {
          const errorBody = await response.text()

          // Retry on transient errors
          if (isRetryable(response.status) && attempt < RETRY_CONFIG.maxRetries) {
            await delay(getBackoffDelay(attempt))
            continue
          }

          return {
            success: false,
            error: `OpenRouter API error (${response.status}): ${errorBody}`,
            rawResponse: errorBody
          }
        }

        const reader = response.body?.getReader()
        if (!reader) {
          return { success: false, error: 'Response body is not readable' }
        }

        const result = await this.readStream(reader, onChunk)
        return result
      } catch (error) {
        // Retry on network errors
        if (attempt < RETRY_CONFIG.maxRetries) {
          await delay(getBackoffDelay(attempt))
          continue
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Should never reach here, but satisfy TypeScript
    return { success: false, error: 'Max retries exceeded' }
  }

  /** Read and parse an SSE stream from the OpenRouter API */
  private async readStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk?: (chunk: AIStreamChunk) => void
  ): Promise<ShaderGenerationResult> {
    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''

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

          // Skip empty lines and keep-alive comments (": OPENROUTER PROCESSING")
          if (!line || line.startsWith(':')) continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onChunk?.({ content: '', done: true })
              break
            }

            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>
                error?: { message: string }
              }

              // Check for mid-stream errors
              if (parsed.error) {
                return {
                  success: false,
                  error: parsed.error.message,
                  rawResponse: fullContent
                }
              }

              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullContent += content
                onChunk?.({ content, done: false })
              }
            } catch {
              // Ignore malformed JSON chunks (partial data or keep-alive)
            }
          }
        }
      }
    } finally {
      reader.cancel()
    }

    if (!fullContent) {
      return { success: false, error: 'No content received from stream' }
    }

    try {
      const shader = parseShaderResponse(fullContent)
      return { success: true, shader, rawResponse: fullContent }
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse shader response: ${error instanceof Error ? error.message : 'Unknown parse error'}`,
        rawResponse: fullContent
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  /** Update the provider configuration (e.g., change model or temperature) */
  updateConfig(updates: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...updates }
  }
}
