import { makeAutoObservable, toJS } from 'mobx'
import type { Layer, LayerId, GroupLayer, ImageLayer, TextLayer } from '@renderer/types/layers'
import { isGroupLayer } from '@renderer/types/layers'
import type { ShaderComponent } from '@renderer/types/shader'
import type { Project } from '@renderer/types/project'
import { createDefaultProject, generateId } from '@renderer/types/project'

export class ProjectStore {
  project: Project | null = null

  constructor() {
    makeAutoObservable(this)
  }

  // ─── Project Lifecycle ───

  get hasProject(): boolean {
    return this.project !== null
  }

  newProject(name?: string): void {
    this.project = createDefaultProject(name)
  }

  loadProject(data: Project): void {
    this.project = data
  }

  closeProject(): void {
    this.project = null
  }

  /** Serialize the current project to a plain JSON-safe object */
  serializeProject(): Project | null {
    if (!this.project) return null
    return toJS(this.project)
  }

  // ─── Layer Tree ───

  get layers(): Layer[] {
    return this.project?.layers ?? []
  }

  get rootLayer(): GroupLayer | null {
    const layers = this.project?.layers ?? []
    const root = layers.find((layer): layer is GroupLayer => isGroupLayer(layer))
    return root ?? null
  }

  get rootLayerId(): LayerId | null {
    return this.rootLayer?.id ?? null
  }

  /** Recursively find a layer by ID */
  findLayer(id: LayerId, layers: Layer[] = this.layers): Layer | undefined {
    for (const layer of layers) {
      if (layer.id === id) return layer
      if (isGroupLayer(layer)) {
        const found = this.findLayer(id, layer.children)
        if (found) return found
      }
    }
    return undefined
  }

  /** Find the parent group that contains a layer, or null if at root */
  findParent(
    id: LayerId,
    layers: Layer[] = this.layers,
    parent: GroupLayer | null = null
  ): GroupLayer | null {
    for (const layer of layers) {
      if (layer.id === id) return parent
      if (isGroupLayer(layer)) {
        const found = this.findParent(id, layer.children, layer)
        if (found !== null) return found
      }
    }
    return null
  }

  /** Get the array that contains a layer (root layers array or parent's children) */
  private getContainingArray(id: LayerId): Layer[] | undefined {
    if (!this.project) return undefined
    // Check root
    if (this.project.layers.some((l) => l.id === id)) return this.project.layers
    // Check nested
    const parent = this.findParent(id)
    if (parent && isGroupLayer(parent)) return parent.children
    return undefined
  }

  addLayer(layer: Layer, parentId?: LayerId): void {
    if (!this.project) return
    const resolvedParentId = parentId ?? this.rootLayerId ?? undefined
    if (resolvedParentId) {
      const parent = this.findLayer(resolvedParentId)
      if (parent && isGroupLayer(parent)) {
        parent.children.push(layer)
        return
      }
    }
    this.project.layers.push(layer)
  }

  removeLayer(id: LayerId): void {
    if (!this.project) return
    const removeFrom = (layers: Layer[]): boolean => {
      const idx = layers.findIndex((l) => l.id === id)
      if (idx >= 0) {
        layers.splice(idx, 1)
        return true
      }
      for (const layer of layers) {
        if (isGroupLayer(layer) && removeFrom(layer.children)) return true
      }
      return false
    }
    removeFrom(this.project.layers)
  }

  updateLayer(id: LayerId, updates: Partial<Layer>): void {
    const layer = this.findLayer(id)
    if (layer) {
      Object.assign(layer, updates)
    }
  }

  moveLayer(id: LayerId, targetParentId: LayerId | null, targetIndex: number): void {
    if (!this.project) return
    const layer = this.findLayer(id)
    if (!layer) return

    // Remove from current location
    const containingArray = this.getContainingArray(id)
    if (!containingArray) return
    const currentIdx = containingArray.findIndex((l) => l.id === id)
    if (currentIdx >= 0) containingArray.splice(currentIdx, 1)

    // Add to new location
    if (targetParentId) {
      const parent = this.findLayer(targetParentId)
      if (parent && isGroupLayer(parent)) {
        parent.children.splice(targetIndex, 0, layer)
        return
      }
    }
    this.project.layers.splice(targetIndex, 0, layer)
  }

  // ─── Layer Creation Helpers ───

  createImageLayer(
    src: string,
    name: string,
    naturalWidth: number,
    naturalHeight: number,
    parentId?: LayerId
  ): ImageLayer {
    const layer: ImageLayer = {
      id: generateId(),
      type: 'image',
      name,
      visible: true,
      locked: false,
      opacity: 1,
      position: { x: 0, y: 0 },
      size: { width: naturalWidth, height: naturalHeight },
      rotation: 0,
      zIndex: this.layers.length,
      src,
      naturalSize: { width: naturalWidth, height: naturalHeight }
    }
    this.addLayer(layer, parentId)
    return layer
  }

  createTextLayer(content: string, parentId?: LayerId): TextLayer {
    const layer: TextLayer = {
      id: generateId(),
      type: 'text',
      name: content.slice(0, 20) || 'Text',
      visible: true,
      locked: false,
      opacity: 1,
      position: { x: 0, y: 0 },
      size: { width: 200, height: 50 },
      rotation: 0,
      zIndex: this.layers.length,
      content,
      fontSize: 24,
      fontFamily: 'Inter',
      fontWeight: 400,
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4
    }
    this.addLayer(layer, parentId)
    return layer
  }

  createGroupLayer(name: string = 'Group', parentId?: LayerId): GroupLayer {
    const layer: GroupLayer = {
      id: generateId(),
      type: 'group',
      name,
      visible: true,
      locked: false,
      opacity: 1,
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      rotation: 0,
      zIndex: this.layers.length,
      children: [],
      shaderComponents: [],
      expanded: true
    }
    this.addLayer(layer, parentId)
    return layer
  }

  createEmptyLayer(name: string, parentId?: LayerId): GroupLayer {
    const layer: GroupLayer = {
      id: generateId(),
      type: 'group',
      name,
      visible: true,
      locked: false,
      opacity: 1,
      position: { x: 0, y: 0 },
      size: { width: 1920, height: 1080 },
      rotation: 0,
      zIndex: this.layers.length,
      children: [],
      shaderComponents: [],
      expanded: true
    }
    this.addLayer(layer, parentId)
    return layer
  }

  // ─── Shader Components ───

  get shaderComponents(): Record<string, ShaderComponent> {
    return this.project?.shaderComponents ?? {}
  }

  addShaderComponent(component: ShaderComponent, layerId: LayerId): void {
    if (!this.project) return
    this.project.shaderComponents[component.id] = component
    const layer = this.findLayer(layerId)
    if (layer && isGroupLayer(layer)) {
      layer.shaderComponents.push(component.id)
    }
  }

  removeShaderComponent(componentId: string, layerId: LayerId): void {
    if (!this.project) return
    delete this.project.shaderComponents[componentId]
    const layer = this.findLayer(layerId)
    if (layer && isGroupLayer(layer)) {
      const idx = layer.shaderComponents.indexOf(componentId)
      if (idx >= 0) layer.shaderComponents.splice(idx, 1)
    }
  }

  updateShaderComponent(componentId: string, updates: Partial<ShaderComponent>): void {
    if (!this.project) return
    const component = this.project.shaderComponents[componentId]
    if (component) {
      Object.assign(component, updates, { updatedAt: Date.now() })
    }
  }

  updateShaderUniform(componentId: string, uniformName: string, value: unknown): void {
    if (!this.project) return
    const component = this.project.shaderComponents[componentId]
    if (!component) return
    const uniform = component.uniforms.find((u) => u.uniformName === uniformName)
    if (uniform) {
      // Use type assertion — the caller is responsible for matching value to uniform type
      ;(uniform as unknown as { value: unknown }).value = value
    }
  }

  getShaderComponent(id: string): ShaderComponent | undefined {
    return this.project?.shaderComponents[id]
  }
}
