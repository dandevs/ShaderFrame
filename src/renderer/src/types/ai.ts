import type { ParsedShaderResult } from './shader'

/** Chat message for AI conversation */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Configuration for an AI provider */
export interface AIProviderConfig {
  apiKey: string
  model: string
  baseUrl?: string
  maxTokens?: number
  temperature?: number
}

/** Result from shader generation */
export interface ShaderGenerationResult {
  success: boolean
  shader?: ParsedShaderResult
  error?: string
  /** Raw AI response for debugging */
  rawResponse?: string
}

/** Streaming chunk from AI response */
export interface AIStreamChunk {
  content: string
  done: boolean
}

/** Context passed to AI for better shader generation */
export interface ShaderGenerationContext {
  /** Number of child images in the layer group */
  imageCount: number
  /** Names of child layers for contextual generation */
  childLayerNames: string[]
  /** Existing shader code to modify (for edit mode) */
  existingShader?: string
  /** Previous prompt (for edit mode) */
  previousPrompt?: string
}

/** AI provider interface — implement this for each backend */
export interface AIProvider {
  readonly name: string

  /** Generate a shader from a text prompt */
  generateShader(prompt: string, context?: ShaderGenerationContext): Promise<ShaderGenerationResult>

  /** Generate a shader with streaming response */
  generateShaderStream(
    prompt: string,
    context?: ShaderGenerationContext,
    onChunk?: (chunk: AIStreamChunk) => void
  ): Promise<ShaderGenerationResult>

  /** Test the connection/API key validity */
  testConnection(): Promise<boolean>
}
