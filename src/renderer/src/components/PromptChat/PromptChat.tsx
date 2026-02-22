import { useState, useCallback, useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useProjectStore, useUIStore } from '@renderer/providers/StoreProvider'
import { isGroupLayer } from '@renderer/types/layers'
import type { ShaderGenerationContext, AIProvider } from '@renderer/types/ai'
import type { ShaderComponent } from '@renderer/types/shader'
import { generateId } from '@renderer/types/project'
import { createAIProvider } from '@renderer/services/ai'
import { Button, TextArea, IconButton } from '@renderer/ui-library'

type PromptStatus = 'idle' | 'loading' | 'error' | 'success'

interface PromptChatProps {
  className?: string
}

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4'

/** Build shader generation context from the selected layer */
function buildContext(
  projectStore: ReturnType<typeof useProjectStore>,
  layerId: string | null,
  existingComponent?: ShaderComponent
): ShaderGenerationContext {
  const context: ShaderGenerationContext = {
    imageCount: 0,
    childLayerNames: []
  }

  if (layerId) {
    const layer = projectStore.findLayer(layerId)
    if (layer && isGroupLayer(layer)) {
      context.imageCount = layer.children.filter((c) => c.type === 'image').length
      context.childLayerNames = layer.children.map((c) => c.name)
    }
  }

  if (existingComponent) {
    context.existingShader = existingComponent.fragmentShader
    context.previousPrompt = existingComponent.prompt
  }

  return context
}

/** Create or retrieve an AI provider instance */
async function getProvider(): Promise<AIProvider | null> {
  try {
    const hasKey = await window.api.hasApiKey()
    if (!hasKey) return null

    const apiKey = await window.api.retrieveApiKey()
    if (!apiKey) return null

    return createAIProvider('openrouter', {
      apiKey,
      model: DEFAULT_MODEL
    })
  } catch {
    return null
  }
}

export const PromptChat = observer(function PromptChat({
  className = ''
}: PromptChatProps): React.JSX.Element {
  const projectStore = useProjectStore()
  const uiStore = useUIStore()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<PromptStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [streamContent, setStreamContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const isEditMode = uiStore.promptEditMode
  const editingComponentId = uiStore.editingShaderComponentId
  const editingComponent = editingComponentId
    ? projectStore.getShaderComponent(editingComponentId)
    : undefined

  // Pre-fill prompt in edit mode
  useEffect(() => {
    if (isEditMode && editingComponent) {
      setPrompt(editingComponent.prompt)
    } else {
      setPrompt('')
    }
    setStatus('idle')
    setErrorMessage('')
    setStreamContent('')
  }, [isEditMode, editingComponent])

  // Focus textarea when panel opens
  useEffect(() => {
    if (uiStore.panels.prompt) {
      setTimeout(() => textAreaRef.current?.focus(), 100)
    }
  }, [uiStore.panels.prompt])

  const handleSubmit = useCallback(async () => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || !uiStore.selectedLayerId) return

    setStatus('loading')
    setErrorMessage('')
    setStreamContent('')

    const provider = await getProvider()
    if (!provider) {
      setStatus('error')
      setErrorMessage('No API key configured. Please set your OpenRouter API key in settings.')
      return
    }

    const context = buildContext(projectStore, uiStore.selectedLayerId, editingComponent)

    try {
      const result = await provider.generateShaderStream(trimmedPrompt, context, (chunk) => {
        if (!chunk.done) {
          setStreamContent((prev) => prev + chunk.content)
        }
      })

      if (!result.success || !result.shader) {
        setStatus('error')
        setErrorMessage(result.error ?? 'Shader generation failed.')
        return
      }

      const { shader } = result

      if (isEditMode && editingComponentId) {
        // Update existing shader component
        projectStore.updateShaderComponent(editingComponentId, {
          prompt: trimmedPrompt,
          name: shader.name,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          uniforms: shader.uniforms
        })
      } else {
        // Create new shader component
        const component: ShaderComponent = {
          id: generateId(),
          prompt: trimmedPrompt,
          name: shader.name,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          uniforms: shader.uniforms,
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        projectStore.addShaderComponent(component, uiStore.selectedLayerId)
      }

      setStatus('success')
      setTimeout(() => {
        uiStore.closePrompt()
      }, 800)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setStatus('error')
      setErrorMessage((err as Error).message ?? 'An unexpected error occurred.')
    }
  }, [prompt, projectStore, uiStore, isEditMode, editingComponentId, editingComponent])

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    if (status === 'loading') {
      setStatus('idle')
      setStreamContent('')
    } else {
      uiStore.closePrompt()
    }
  }, [status, uiStore])

  const handleRetry = useCallback(() => {
    setStatus('idle')
    setErrorMessage('')
    setStreamContent('')
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSubmit()
      }
      if (e.key === 'Escape') {
        handleCancel()
      }
    },
    [handleSubmit, handleCancel]
  )

  const selectedLayer = uiStore.selectedLayerId
    ? projectStore.findLayer(uiStore.selectedLayerId)
    : undefined

  return (
    <div
      className={`flex flex-col bg-surface-50 dark:bg-surface-850 border-t border-surface-200 dark:border-surface-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-surface-200 dark:border-surface-700">
        <span className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider">
          {isEditMode ? 'Edit Shader' : 'Generate Shader'}
        </span>
        <IconButton label="Close prompt" size="sm" onClick={handleCancel}>
          <span className="text-xs">✕</span>
        </IconButton>
      </div>

      <div className="p-2 space-y-2">
        {/* Layer context */}
        {selectedLayer && (
          <div className="text-[10px] text-surface-400 dark:text-surface-500">
            Target:{' '}
            <span className="font-medium text-surface-600 dark:text-surface-300">
              {selectedLayer.name}
            </span>
            {isGroupLayer(selectedLayer) && (
              <span> ({selectedLayer.children.length} children)</span>
            )}
          </div>
        )}

        {/* Prompt input */}
        <TextArea
          ref={textAreaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isEditMode
              ? 'Modify your shader prompt...'
              : 'Describe the shader effect you want (e.g., "Transition blend between images")...'
          }
          resize="vertical"
          disabled={status === 'loading'}
          className="min-h-20"
        />

        {/* Streaming output */}
        {status === 'loading' && streamContent && (
          <div className="max-h-32 overflow-y-auto rounded-md bg-surface-100 dark:bg-surface-800 p-2">
            <pre className="text-[10px] font-mono text-surface-600 dark:text-surface-400 whitespace-pre-wrap break-all">
              {streamContent}
            </pre>
          </div>
        )}

        {/* Status indicators */}
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-xs text-primary-500">
            <span className="animate-pulse">●</span>
            <span>Generating shader...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col gap-1.5 p-2 rounded-md bg-danger-500/10 border border-danger-500/20">
            <span className="text-xs text-danger-500">{errorMessage}</span>
            <Button size="sm" variant="ghost" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-xs text-success-500">
            <span>✓</span>
            <span>Shader generated successfully!</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSubmit}
            disabled={!prompt.trim() || status === 'loading'}
          >
            {status === 'loading' ? 'Generating...' : isEditMode ? 'Update Shader' : 'Generate'}
          </Button>
        </div>

        {/* Keyboard hint */}
        <div className="text-[10px] text-surface-400 dark:text-surface-500 text-right">
          Ctrl+Enter to submit · Esc to close
        </div>
      </div>
    </div>
  )
})
