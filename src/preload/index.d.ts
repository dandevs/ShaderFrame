import { ElectronAPI } from '@electron-toolkit/preload'

/** Typed API exposed to the renderer via contextBridge */
interface ShaderFrameAPI {
  /** Open a file dialog to select a single image */
  openImage(): Promise<{ name: string; dataUri: string } | null>
  /** Open a file dialog to select multiple images */
  openImages(): Promise<Array<{ name: string; dataUri: string }>>
  /** Save project JSON to a file (shows save dialog). Returns saved file path or null. */
  saveProject(projectJson: string): Promise<string | null>
  /** Load project JSON from a file (shows open dialog). Returns JSON string or null. */
  loadProject(): Promise<string | null>
  /** Store the API key securely using Electron safeStorage */
  storeApiKey(key: string): Promise<boolean>
  /** Retrieve the stored API key (decrypted) */
  retrieveApiKey(): Promise<string | null>
  /** Check if an API key has been stored */
  hasApiKey(): Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ShaderFrameAPI
  }
}
