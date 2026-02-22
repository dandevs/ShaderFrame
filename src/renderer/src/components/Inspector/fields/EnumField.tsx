import { useCallback, type ChangeEvent } from 'react'
import type { ShaderUniform } from '@renderer/types/shader'
import { Select } from '@renderer/ui-library'

interface EnumFieldProps {
  uniform: ShaderUniform<'enum'>
  onChange: (value: string) => void
}

export function EnumField({ uniform, onChange }: EnumFieldProps): React.JSX.Element {
  const options = (uniform.options ?? []).map((opt) => ({
    label: opt,
    value: opt
  }))

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  return (
    <Select
      label={uniform.name}
      options={options}
      value={uniform.value}
      onChange={handleChange}
      size="sm"
    />
  )
}
