import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { ThemeStore } from '@renderer/stores/ThemeStore'

const themeStore = new ThemeStore()

const ThemeContext = createContext<ThemeStore>(themeStore)

export function useThemeStore(): ThemeStore {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = observer(function ThemeProvider({
  children
}: ThemeProviderProps): React.JSX.Element {
  useEffect(() => {
    const root = document.documentElement
    if (themeStore.isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [themeStore.theme])

  return <ThemeContext.Provider value={themeStore}>{children}</ThemeContext.Provider>
})
