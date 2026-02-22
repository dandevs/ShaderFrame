import { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useProjectStore, useUIStore } from '@renderer/providers/StoreProvider'
import { useThemeStore } from '@renderer/providers/ThemeProvider'
import { IconButton, Tooltip } from '@renderer/ui-library'

export const Toolbar = observer(function Toolbar(): React.JSX.Element {
  const projectStore = useProjectStore()
  const uiStore = useUIStore()
  const themeStore = useThemeStore()

  const handleHome = useCallback(() => {
    uiStore.setShowHomeScreen(true)
  }, [uiStore])

  const handleNewProject = useCallback(() => {
    projectStore.newProject()
    uiStore.setShowHomeScreen(false)
    uiStore.selectLayer(null)
  }, [projectStore, uiStore])

  const handleAddText = useCallback(() => {
    if (!projectStore.hasProject) {
      projectStore.newProject()
      uiStore.setShowHomeScreen(false)
    }
    projectStore.createTextLayer('New Text')
  }, [projectStore, uiStore])

  const handleToggleTheme = useCallback(() => {
    themeStore.toggleTheme()
  }, [themeStore])

  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1 bg-surface-100 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
      {/* Left group — navigation */}
      <Tooltip content="Home" position="bottom">
        <IconButton label="Home" size="md" onClick={handleHome}>
          <span className="text-sm">🏠</span>
        </IconButton>
      </Tooltip>

      <Tooltip content="New Project" position="bottom">
        <IconButton label="New project" size="md" onClick={handleNewProject}>
          <span className="text-sm">📄</span>
        </IconButton>
      </Tooltip>

      {/* Separator */}
      <div className="w-px h-5 bg-surface-300 dark:bg-surface-600 mx-1" />

      {/* Tools */}
      <Tooltip content="Add Text Layer" position="bottom">
        <IconButton label="Add text layer" size="md" onClick={handleAddText}>
          <span className="text-sm font-bold">T</span>
        </IconButton>
      </Tooltip>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right group — settings */}
      <Tooltip
        content={themeStore.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        position="bottom"
      >
        <IconButton label="Toggle theme" size="md" onClick={handleToggleTheme}>
          <span className="text-sm">{themeStore.isDark ? '☀️' : '🌙'}</span>
        </IconButton>
      </Tooltip>
    </div>
  )
})
