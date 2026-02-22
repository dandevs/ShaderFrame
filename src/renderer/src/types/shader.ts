/** Supported shader uniform types */
export type UniformType =
  | 'float'
  | 'int'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'color'
  | 'bool'
  | 'enum'
  | 'texture'

/** Maps each uniform type to its corresponding TypeScript value type */
export interface UniformValueMap {
  float: number
  int: number
  vec2: [number, number]
  vec3: [number, number, number]
  vec4: [number, number, number, number]
  /** Hex color string */
  color: string
  bool: boolean
  enum: string
  /** Texture source URL or null when no texture is assigned */
  texture: string | null
}

/** A single shader uniform variable exposed to the inspector */
export interface ShaderUniform<T extends UniformType = UniformType> {
  /** Display name for the inspector UI */
  name: string
  /** Internal uniform name used in GLSL code */
  uniformName: string
  type: T
  value: UniformValueMap[T]
  /** Default value for reset functionality */
  defaultValue: UniformValueMap[T]
  /** Minimum value (for float, int, vec components) */
  min?: number
  /** Maximum value (for float, int, vec components) */
  max?: number
  /** Step increment (for float, int sliders) */
  step?: number
  /** Options for enum type */
  options?: string[]
  /** Tooltip/description shown in the inspector */
  description?: string
}

/** A shader component that can be applied to a GroupLayer */
export interface ShaderComponent {
  id: string
  /** The user's prompt that generated this shader */
  prompt: string
  /** Display name */
  name: string
  /** Generated GLSL vertex shader code */
  vertexShader: string
  /** Generated GLSL fragment shader code */
  fragmentShader: string
  /** Uniform variables exposed to the inspector */
  uniforms: ShaderUniform[]
  /** Whether the shader is currently enabled */
  enabled: boolean
  /** Timestamp of creation (epoch ms) */
  createdAt: number
  /** Timestamp of last modification (epoch ms) */
  updatedAt: number
}

/** Result of parsing AI-generated shader code */
export interface ParsedShaderResult {
  name: string
  vertexShader: string
  fragmentShader: string
  uniforms: ShaderUniform[]
}
