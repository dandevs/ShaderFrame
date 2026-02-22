import { useState, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useProjectStore, useUIStore } from '@renderer/providers/StoreProvider'
import { useThemeStore } from '@renderer/providers/ThemeProvider'
import type { Project } from '@renderer/types/project'
import { Button, Input, IconButton, Tooltip } from '@renderer/ui-library'

/**
 * HomeScreen — Welcome/landing screen shown before a project is active.
 *
 * Features:
 * - New project creation
 * - Load existing .sfproj file
 * - API key configuration (OpenRouter)
 * - Theme toggle
 */
export const HomeScreen = observer(function HomeScreen(): React.JSX.Element {
  const projectStore = useProjectStore()
  const uiStore = useUIStore()
  const themeStore = useThemeStore()

  const [apiKey, setApiKey] = useState('')
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [hasKey, setHasKey] = useState<boolean | null>(null)

  // Check if API key exists on mount
  useState(() => {
    window.api
      .hasApiKey()
      .then(setHasKey)
      .catch(() => setHasKey(false))
  })

  const handleNewProject = useCallback(() => {
    projectStore.newProject()
    uiStore.setShowHomeScreen(false)
  }, [projectStore, uiStore])

  const handleLoadProject = useCallback(async () => {
    try {
      const json = await window.api.loadProject()
      if (!json) return

      const data = JSON.parse(json) as Project
      projectStore.loadProject(data)
      uiStore.setShowHomeScreen(false)
    } catch (err) {
      console.error('Failed to load project:', err)
    }
  }, [projectStore, uiStore])

  const handleSaveApiKey = useCallback(async () => {
    const trimmed = apiKey.trim()
    if (!trimmed) return

    try {
      const success = await window.api.storeApiKey(trimmed)
      if (success) {
        setApiKeyStatus('saved')
        setHasKey(true)
        setApiKey('')
        setTimeout(() => setApiKeyStatus('idle'), 2000)
      } else {
        setApiKeyStatus('error')
      }
    } catch {
      setApiKeyStatus('error')
    }
  }, [apiKey])

  const handleToggleTheme = useCallback(() => {
    themeStore.toggleTheme()
  }, [themeStore])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-surface-100 dark:bg-surface-900">
      {/* Theme toggle — top right */}
      <div className="absolute top-3 right-3">
        <Tooltip
          content={themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          position="left"
        >
          <IconButton label="Toggle theme" size="md" onClick={handleToggleTheme}>
            <span className="text-sm">{themeStore.isDark ? '☀️' : '🌙'}</span>
          </IconButton>
        </Tooltip>
      </div>

      {/* Main card */}
      <div className="flex flex-col items-center gap-8 max-w-md w-full px-6">
        {/* Logo / title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
            ShaderFrame
          </h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            AI-powered image editor with shader effects
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <Button variant="primary" size="lg" onClick={handleNewProject} className="w-full">
            New Project
          </Button>
          <Button variant="secondary" size="lg" onClick={handleLoadProject} className="w-full">
            Open Project
          </Button>
        </div>

        {/* API Key section */}
        <div className="w-full border-t border-surface-200 dark:border-surface-700 pt-6">
          <h2 className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider mb-3">
            OpenRouter API Key
          </h2>

          {hasKey === true && apiKeyStatus !== 'saved' && (
            <p className="text-xs text-success-500 mb-2">API key configured</p>
          )}

          {apiKeyStatus === 'saved' && (
            <p className="text-xs text-success-500 mb-2">API key saved successfully!</p>
          )}

          {apiKeyStatus === 'error' && (
            <p className="text-xs text-danger-500 mb-2">Failed to save API key</p>
          )}

          <div className="flex gap-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasKey ? 'Replace existing key...' : 'sk-or-v1-...'}
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="md"
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
            >
              Save
            </Button>
          </div>

          <p className="mt-2 text-[10px] text-surface-400 dark:text-surface-500">
            Required for AI shader generation.{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-primary-500 hover:text-primary-400 underline"
            >
              Get a key
            </a>
          </p>
        </div>

        {/* Version info */}
        <p className="text-[10px] text-surface-400 dark:text-surface-500">
          Electron + React + React Three Fiber
        </p>
      </div>
    </div>
  )
})
