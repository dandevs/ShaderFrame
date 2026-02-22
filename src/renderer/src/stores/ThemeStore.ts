import { makeAutoObservable } from 'mobx'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'shaderframe-theme'

const getInitialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage may not be available
  }
  return 'dark' // Default to dark for an image editor
}

export class ThemeStore {
  theme: Theme = getInitialTheme()

  constructor() {
    makeAutoObservable(this)
  }

  get isDark(): boolean {
    return this.theme === 'dark'
  }

  setTheme(theme: Theme): void {
    this.theme = theme
    this.persistTheme()
  }

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark'
    this.persistTheme()
  }

  private persistTheme(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.theme)
    } catch {
      // Silently fail if localStorage unavailable
    }
  }
}
