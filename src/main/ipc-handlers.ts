import { ipcMain, dialog, safeStorage, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { basename } from 'path'

/** Supported image file extensions for the open dialog */
const IMAGE_FILTERS: Electron.FileFilter[] = [
  { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] }
]

/** Project file filter for save/load dialogs */
const PROJECT_FILTERS: Electron.FileFilter[] = [
  { name: 'ShaderFrame Project', extensions: ['sfproj'] }
]

/** In-memory storage for encrypted API key buffer */
let encryptedApiKey: Buffer | null = null

/** Fallback plain-text key when safeStorage encryption is unavailable (dev only) */
let plaintextApiKeyFallback: string | null = null

/** Map file extension to MIME type for data URI construction */
function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml'
  }
  return mimeMap[ext] ?? 'application/octet-stream'
}

/** Read a file and return its name + base64 data URI */
async function readImageAsDataUri(filePath: string): Promise<{ name: string; dataUri: string }> {
  const buffer = await readFile(filePath)
  const base64 = buffer.toString('base64')
  const mime = getMimeType(filePath)
  const ext = filePath.split('.').pop() ?? ''
  return {
    name: basename(filePath, `.${ext}`),
    dataUri: `data:${mime};base64,${base64}`
  }
}

/**
 * Register all IPC handlers for the main process.
 * Call once during app initialization, after `app.whenReady()`.
 */
export function registerIpcHandlers(): void {
  // ─── File Dialog: Open Single Image ───
  ipcMain.handle(
    'dialog:openImage',
    async (): Promise<{ name: string; dataUri: string } | null> => {
      const window = BrowserWindow.getFocusedWindow()
      if (!window) return null

      const result = await dialog.showOpenDialog(window, {
        title: 'Open Image',
        filters: IMAGE_FILTERS,
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) return null

      return readImageAsDataUri(result.filePaths[0])
    }
  )

  // ─── File Dialog: Open Multiple Images ───
  ipcMain.handle(
    'dialog:openImages',
    async (): Promise<Array<{ name: string; dataUri: string }>> => {
      const window = BrowserWindow.getFocusedWindow()
      if (!window) return []

      const result = await dialog.showOpenDialog(window, {
        title: 'Open Images',
        filters: IMAGE_FILTERS,
        properties: ['openFile', 'multiSelections']
      })

      if (result.canceled || result.filePaths.length === 0) return []

      return Promise.all(result.filePaths.map(readImageAsDataUri))
    }
  )

  // ─── Project: Save ───
  ipcMain.handle('project:save', async (_event, projectJson: string): Promise<string | null> => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return null

    const result = await dialog.showSaveDialog(window, {
      title: 'Save Project',
      filters: PROJECT_FILTERS,
      defaultPath: 'project.sfproj'
    })

    if (result.canceled || !result.filePath) return null

    await writeFile(result.filePath, projectJson, 'utf-8')
    return result.filePath
  })

  // ─── Project: Load ───
  ipcMain.handle('project:load', async (): Promise<string | null> => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return null

    const result = await dialog.showOpenDialog(window, {
      title: 'Open Project',
      filters: PROJECT_FILTERS,
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return null

    return readFile(result.filePaths[0], 'utf-8')
  })

  // ─── API Key: Store (encrypted via safeStorage) ───
  ipcMain.handle('apiKey:store', async (_event, key: string): Promise<boolean> => {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        // Dev fallback: store in memory without encryption
        plaintextApiKeyFallback = key
        return true
      }
      encryptedApiKey = safeStorage.encryptString(key)
      return true
    } catch {
      return false
    }
  })

  // ─── API Key: Retrieve (decrypted via safeStorage) ───
  ipcMain.handle('apiKey:retrieve', async (): Promise<string | null> => {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        return plaintextApiKeyFallback
      }
      if (!encryptedApiKey) return null
      return safeStorage.decryptString(encryptedApiKey)
    } catch {
      return null
    }
  })

  // ─── API Key: Check if a key is stored ───
  ipcMain.handle('apiKey:hasKey', async (): Promise<boolean> => {
    if (!safeStorage.isEncryptionAvailable()) {
      return plaintextApiKeyFallback !== null
    }
    return encryptedApiKey !== null
  })
}
