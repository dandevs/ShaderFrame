// Extend Window interface for Electron API
declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<string>
    }
  }
}

export {}
