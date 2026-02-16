export interface Layer {
  id: string
  name: string
  type: 'image' | 'text' | 'shape' | 'effect'
  visible: boolean
  locked: boolean
  opacity: number
  blendMode: string
}

export interface EditorState {
  layers: Layer[]
  selectedLayerId: string | null
  canvasWidth: number
  canvasHeight: number
}
