import { useCallback, type ChangeEvent } from 'react'
import type { ShaderUniform } from '@renderer/types/shader'

interface Vec3FieldProps {
  uniform: ShaderUniform<'vec3'>
  onChange: (value: [number, number, number]) => void
}

const LABELS = ['X', 'Y', 'Z'] as const

export function Vec3Field({ uniform, onChange }: Vec3FieldProps): React.JSX.Element {
  const handleComponentChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value)
      if (isNaN(parsed)) return
      const next: [number, number, number] = [...uniform.value] as [number, number, number]
      next[index] = parsed
      onChange(next)
    },
    [uniform.value, onChange]
  )

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
        {uniform.name}
      </span>
      <div className="flex items-center gap-1.5">
        {LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-0.5 flex-1 min-w-0">
            <span className="text-[10px] font-medium text-surface-500 dark:text-surface-400 w-3 shrink-0">
              {label}
            </span>
            <input
              type="number"
              value={uniform.value[i]}
              onChange={(e) => handleComponentChange(i, e)}
              step={uniform.step ?? 0.01}
              min={uniform.min}
              max={uniform.max}
              className="
                w-full h-6 px-1.5 text-xs text-right rounded-md border
                bg-surface-50 border-surface-300 text-surface-900
                dark:bg-surface-800 dark:border-surface-600 dark:text-surface-100
                focus:outline-2 focus:outline-primary-500
              "
            />
          </div>
        ))}
      </div>
    </div>
  )
}
