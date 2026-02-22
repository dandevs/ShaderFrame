import type { Layer, GroupLayer } from './layers'
import type { ShaderComponent } from './shader'

/** Project metadata for identification and display */
export interface ProjectMetadata {
  id: string
  name: string
  /** Timestamp of creation (epoch ms) */
  createdAt: number
  /** Timestamp of last modification (epoch ms) */
  updatedAt: number
  /** Canvas/viewport dimensions */
  canvasSize: { width: number; height: number }
}

/** The complete serializable project format */
export interface Project {
  version: 1
  metadata: ProjectMetadata
  /** Root layers (top-level layer tree) */
  layers: Layer[]
  /** All shader components referenced by layers, keyed by component ID */
  shaderComponents: Record<string, ShaderComponent>
}

/** Generate a unique ID using timestamp + random suffix */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/** Create a new empty project with default settings */
export function createDefaultProject(name: string = 'Untitled Project'): Project {
  const rootLayer: GroupLayer = {
    id: generateId(),
    type: 'group',
    name: 'Root',
    position: { x: 0, y: 0 },
    size: { width: 1920, height: 1080 },
    children: [],
    shaderComponents: [],
    expanded: true,
    visible: true,
    locked: false,
    opacity: 1,
    rotation: 0,
    zIndex: 0
  }
  return {
    version: 1,
    metadata: {
      id: generateId(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      canvasSize: { width: 1920, height: 1080 }
    },
    layers: [rootLayer],
    shaderComponents: {}
  }
}
