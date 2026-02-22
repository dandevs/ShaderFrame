import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer — typed in index.d.ts as ShaderFrameAPI
const api = {
  /** Open a file dialog to select a single image */
  openImage: (): Promise<{ name: string; dataUri: string } | null> =>
    ipcRenderer.invoke('dialog:openImage'),

  /** Open a file dialog to select multiple images */
  openImages: (): Promise<Array<{ name: string; dataUri: string }>> =>
    ipcRenderer.invoke('dialog:openImages'),

  /** Save project JSON to a file (shows save dialog). Returns saved file path or null. */
  saveProject: (projectJson: string): Promise<string | null> =>
    ipcRenderer.invoke('project:save', projectJson),

  /** Load project JSON from a file (shows open dialog). Returns JSON string or null. */
  loadProject: (): Promise<string | null> => ipcRenderer.invoke('project:load'),

  /** Store the API key securely using Electron safeStorage */
  storeApiKey: (key: string): Promise<boolean> => ipcRenderer.invoke('apiKey:store', key),

  /** Retrieve the stored API key (decrypted) */
  retrieveApiKey: (): Promise<string | null> => ipcRenderer.invoke('apiKey:retrieve'),

  /** Check if an API key has been stored */
  hasApiKey: (): Promise<boolean> => ipcRenderer.invoke('apiKey:hasKey')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
