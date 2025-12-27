import { IPC_CHANNELS } from '@shared/constants'
import TiktokService from '@shared/services/tiktok.service'
import {
  IDownloadFileOptions,
  IpcGetAwemeDetailsOptions,
  IpcGetAwemeListOptions
} from '@shared/types/ipc.type'
import {
  IAwemeItem,
  IAwemeListResponse,
  IUserInfo,
  ITiktokCredentials
} from '@shared/types/tiktok.type'
import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { pipeline } from 'stream/promises'

const setupIpcHandlers = () => {
  ipcMain.handle(
    IPC_CHANNELS.GET_USER_AWEME_LIST,
    async (
      _event,
      secUid: string,
      options: IpcGetAwemeListOptions
    ): Promise<IAwemeListResponse> => {
      return TiktokService.getUserAwemeList(secUid, options)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GET_USER_INFO,
    async (_event, username: string): Promise<IUserInfo> => {
      return TiktokService.getUserInfo(username)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GET_AWEME_DETAILS,
    async (_event, awemeId: string, options?: IpcGetAwemeDetailsOptions): Promise<IAwemeItem> => {
      return TiktokService.getAwemeDetails(awemeId, options)
    }
  )

  ipcMain.handle(IPC_CHANNELS.GET_TIKTOK_CREDENTIALS, async (): Promise<ITiktokCredentials> => {
    return TiktokService.getCredentials()
  })

  ipcMain.handle(IPC_CHANNELS.SELECT_FOLDER, async (): Promise<string | null> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled) {
      return null
    }
    return filePaths[0]
  })

  ipcMain.handle(
    IPC_CHANNELS.DOWNLOAD_FILE,
    async (_event, options: IDownloadFileOptions): Promise<boolean> => {
      try {
        const { url, fileName, folderPath } = options
        const filePath = path.join(folderPath, fileName)

        const response = await axios.get(url, { responseType: 'stream' })
        const writer = fs.createWriteStream(filePath)

        await pipeline(response.data, writer)
        return true
      } catch (error) {
        console.error('Download failed:', error)
        return false
      }
    }
  )
}

export default setupIpcHandlers
