import { makeAutoObservable } from 'mobx'
import type { LayerId } from '@renderer/types/layers'

export type PanelId = 'layers' | 'inspector' | 'prompt'

export class UIStore {
  /** Currently selected layer ID */
  selectedLayerId: LayerId | null = null

  /** Which panels are visible */
  panels: Record<PanelId, boolean> = {
    layers: true,
    inspector: true,
    prompt: false
  }

  /** The shader component ID being edited in the prompt chat */
  editingShaderComponentId: string | null = null

  /** Whether the prompt chat is in "edit existing" mode vs "create new" */
  promptEditMode: boolean = false

  /** Whether the home screen is showing */
  showHomeScreen: boolean = true

  constructor() {
    makeAutoObservable(this)
  }

  selectLayer(id: LayerId | null): void {
    this.selectedLayerId = id
  }

  togglePanel(panel: PanelId): void {
    this.panels[panel] = !this.panels[panel]
  }

  showPanel(panel: PanelId): void {
    this.panels[panel] = true
  }

  hidePanel(panel: PanelId): void {
    this.panels[panel] = false
  }

  isPanelVisible(panel: PanelId): boolean {
    return this.panels[panel]
  }

  /** Open the prompt chat for creating a new shader on a layer */
  openPromptForNewShader(): void {
    this.editingShaderComponentId = null
    this.promptEditMode = false
    this.panels.prompt = true
  }

  /** Open the prompt chat to edit an existing shader component */
  openPromptForEdit(componentId: string): void {
    this.editingShaderComponentId = componentId
    this.promptEditMode = true
    this.panels.prompt = true
  }

  closePrompt(): void {
    this.panels.prompt = false
    this.editingShaderComponentId = null
    this.promptEditMode = false
  }

  setShowHomeScreen(show: boolean): void {
    this.showHomeScreen = show
  }
}
