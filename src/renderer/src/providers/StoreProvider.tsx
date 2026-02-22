import { createContext, useContext, type ReactNode } from 'react'
import { ProjectStore } from '@renderer/stores/ProjectStore'
import { UIStore } from '@renderer/stores/UIStore'

interface StoreContextValue {
  projectStore: ProjectStore
  uiStore: UIStore
}

const projectStore = new ProjectStore()
const uiStore = new UIStore()

const StoreContext = createContext<StoreContextValue>({ projectStore, uiStore })

export function useStores(): StoreContextValue {
  return useContext(StoreContext)
}

export function useProjectStore(): ProjectStore {
  return useContext(StoreContext).projectStore
}

export function useUIStore(): UIStore {
  return useContext(StoreContext).uiStore
}

interface StoreProviderProps {
  children: ReactNode
}

export function StoreProvider({ children }: StoreProviderProps): React.JSX.Element {
  return <StoreContext.Provider value={{ projectStore, uiStore }}>{children}</StoreContext.Provider>
}
