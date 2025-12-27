import { IpcApi } from '@shared/types/ipc.type'
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '@shared/constants'

// Custom APIs for renderer
const api: IpcApi = {
  getUserInfo: (username) => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_USER_INFO, username)
  },
  getUserAwemeList: (secUid, options) => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_USER_AWEME_LIST, secUid, options)
  },
  getAwemeDetails: (awemeId, options) => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_AWEME_DETAILS, awemeId, options)
  },
  getCredentials: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_TIKTOK_CREDENTIALS)
  },
  selectFolder: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.SELECT_FOLDER)
  },
  downloadFile: (options) => {
    return ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_FILE, options)
  }
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
