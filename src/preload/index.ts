import { contextBridge, ipcRenderer } from 'electron'

// Define the API interface
export interface ElectronAPI {
  ping: () => Promise<string>
  // Add more IPC methods here
}

// Expose protected methods via contextBridge
const electronAPI: ElectronAPI = {
  ping: () => ipcRenderer.invoke('ping')
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
