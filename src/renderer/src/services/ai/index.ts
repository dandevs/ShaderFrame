import type { AIProvider, AIProviderConfig } from '@renderer/types/ai'
import { OpenRouterProvider } from './openrouter-provider'

export { OpenRouterProvider } from './openrouter-provider'
export { buildShaderSystemPrompt, buildShaderUserPrompt } from './shader-prompt'

/** Supported AI provider types */
export type AIProviderType = 'openrouter'

/** Create an AI provider instance by type */
export function createAIProvider(type: AIProviderType, config: AIProviderConfig): AIProvider {
  switch (type) {
    case 'openrouter':
      return new OpenRouterProvider(config)
    default:
      throw new Error(`Unknown AI provider type: ${type as string}`)
  }
}
