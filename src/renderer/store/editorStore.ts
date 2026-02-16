import { create } from 'zustand'
import type { EditorState, Layer } from '@/types/editor'

interface EditorStore extends EditorState {
  addLayer: (layer: Layer) => void
  removeLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  selectLayer: (id: string | null) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  layers: [],
  selectedLayerId: null,
  canvasWidth: 1920,
  canvasHeight: 1080,
  
  addLayer: (layer) =>
    set((state) => ({ layers: [...state.layers, layer] })),
  
  removeLayer: (id) =>
    set((state) => ({ layers: state.layers.filter((l) => l.id !== id) })),
  
  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l))
    })),
  
  selectLayer: (id) => set({ selectedLayerId: id })
}))
