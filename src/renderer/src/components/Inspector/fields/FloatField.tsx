import { useCallback } from 'react'
import type { ShaderUniform } from '@renderer/types/shader'
import { Slider } from '@renderer/ui-library'

interface FloatFieldProps {
  uniform: ShaderUniform<'float'>
  onChange: (value: number) => void
}

export function FloatField({ uniform, onChange }: FloatFieldProps): React.JSX.Element {
  const handleChange = useCallback(
    (value: number) => {
      onChange(value)
    },
    [onChange]
  )

  return (
    <Slider
      label={uniform.name}
      value={uniform.value}
      onChange={handleChange}
      min={uniform.min ?? 0}
      max={uniform.max ?? 1}
      step={uniform.step ?? 0.01}
    />
  )
}
