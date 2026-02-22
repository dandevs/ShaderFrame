/** Unique identifier for layers */
export type LayerId = string

/** Common properties shared by all layer types */
export interface BaseLayer {
  id: LayerId
  name: string
  visible: boolean
  locked: boolean
  /** Opacity value from 0 (transparent) to 1 (opaque) */
  opacity: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  /** Rotation in degrees */
  rotation: number
  /** Z-order index within parent */
  zIndex: number
}

/** A layer that displays an image */
export interface ImageLayer extends BaseLayer {
  type: 'image'
  /** Source URL or data URI of the image */
  src: string
  /** Original image dimensions for aspect ratio preservation */
  naturalSize: { width: number; height: number }
}

/** A layer that displays 3D text (rendered via Three.js) */
export interface TextLayer extends BaseLayer {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  /** Hex color string */
  color: string
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
}

/** A group layer that can contain child layers and have shader components */
export interface GroupLayer extends BaseLayer {
  type: 'group'
  children: Layer[]
  /** Shader component IDs applied to this group and its children */
  shaderComponents: string[]
  /** Whether the group is expanded in the layer panel */
  expanded: boolean
}

/** Discriminated union of all layer types */
export type Layer = ImageLayer | TextLayer | GroupLayer

/** Type guard for GroupLayer */
export function isGroupLayer(layer: Layer): layer is GroupLayer {
  return layer.type === 'group'
}

/** Type guard for ImageLayer */
export function isImageLayer(layer: Layer): layer is ImageLayer {
  return layer.type === 'image'
}

/** Type guard for TextLayer */
export function isTextLayer(layer: Layer): layer is TextLayer {
  return layer.type === 'text'
}
