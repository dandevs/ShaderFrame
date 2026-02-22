import { useCallback, type ChangeEvent } from 'react'
import type { ShaderUniform } from '@renderer/types/shader'
import { Checkbox } from '@renderer/ui-library'

interface BoolFieldProps {
  uniform: ShaderUniform<'bool'>
  onChange: (value: boolean) => void
}

export function BoolField({ uniform, onChange }: BoolFieldProps): React.JSX.Element {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.checked)
    },
    [onChange]
  )

  return <Checkbox label={uniform.name} checked={uniform.value} onChange={handleChange} />
}
