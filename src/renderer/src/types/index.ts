export type { LayerId, BaseLayer, ImageLayer, TextLayer, GroupLayer, Layer } from './layers'
export { isGroupLayer, isImageLayer, isTextLayer } from './layers'

export type {
  UniformType,
  UniformValueMap,
  ShaderUniform,
  ShaderComponent,
  ParsedShaderResult
} from './shader'

export type { ProjectMetadata, Project } from './project'
export { createDefaultProject, generateId } from './project'

export type {
  AIMessage,
  AIProviderConfig,
  ShaderGenerationResult,
  AIStreamChunk,
  AIProvider,
  ShaderGenerationContext
} from './ai'
