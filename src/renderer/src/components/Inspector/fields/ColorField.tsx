import { useCallback } from 'react'
import type { ShaderUniform } from '@renderer/types/shader'
import { ColorPicker } from '@renderer/ui-library'

interface ColorFieldProps {
  uniform: ShaderUniform<'color'>
  onChange: (value: string) => void
}

export function ColorField({ uniform, onChange }: ColorFieldProps): React.JSX.Element {
  const handleChange = useCallback(
    (value: string) => {
      onChange(value)
    },
    [onChange]
  )

  return <ColorPicker label={uniform.name} value={uniform.value} onChange={handleChange} />
}
