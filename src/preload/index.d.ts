import { IpcApi } from '@shared/types/ipc.type'
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    api: IpcApi
    electron: ElectronAPI
  }
}
