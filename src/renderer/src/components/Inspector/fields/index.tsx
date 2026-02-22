import type { ShaderUniform, UniformType, UniformValueMap } from '@renderer/types/shader'
import { FloatField } from './FloatField'
import { Vec2Field } from './Vec2Field'
import { Vec3Field } from './Vec3Field'
import { Vec4Field } from './Vec4Field'
import { ColorField } from './ColorField'
import { BoolField } from './BoolField'
import { EnumField } from './EnumField'

export { FloatField } from './FloatField'
export { Vec2Field } from './Vec2Field'
export { Vec3Field } from './Vec3Field'
export { Vec4Field } from './Vec4Field'
export { ColorField } from './ColorField'
export { BoolField } from './BoolField'
export { EnumField } from './EnumField'

interface UniformFieldProps {
  uniform: ShaderUniform
  onChange: (uniformName: string, value: UniformValueMap[UniformType]) => void
}

/** Dispatches to the correct field renderer based on uniform type */
export function UniformField({ uniform, onChange }: UniformFieldProps): React.JSX.Element | null {
  const handleChange = (value: UniformValueMap[UniformType]): void => {
    onChange(uniform.uniformName, value)
  }

  switch (uniform.type) {
    case 'float':
    case 'int':
      return (
        <FloatField
          uniform={uniform as ShaderUniform<'float'>}
          onChange={handleChange as (v: number) => void}
        />
      )
    case 'vec2':
      return (
        <Vec2Field
          uniform={uniform as ShaderUniform<'vec2'>}
          onChange={handleChange as (v: [number, number]) => void}
        />
      )
    case 'vec3':
      return (
        <Vec3Field
          uniform={uniform as ShaderUniform<'vec3'>}
          onChange={handleChange as (v: [number, number, number]) => void}
        />
      )
    case 'vec4':
      return (
        <Vec4Field
          uniform={uniform as ShaderUniform<'vec4'>}
          onChange={handleChange as (v: [number, number, number, number]) => void}
        />
      )
    case 'color':
      return (
        <ColorField
          uniform={uniform as ShaderUniform<'color'>}
          onChange={handleChange as (v: string) => void}
        />
      )
    case 'bool':
      return (
        <BoolField
          uniform={uniform as ShaderUniform<'bool'>}
          onChange={handleChange as (v: boolean) => void}
        />
      )
    case 'enum':
      return (
        <EnumField
          uniform={uniform as ShaderUniform<'enum'>}
          onChange={handleChange as (v: string) => void}
        />
      )
    case 'texture':
      // Texture field is a placeholder — full implementation in viewport subtask
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
            {uniform.name}
          </span>
          <span className="text-xs text-surface-400 dark:text-surface-500 italic">
            Texture (not editable yet)
          </span>
        </div>
      )
    default:
      return null
  }
}
