const IPC_CHANNELS = {
  GET_USER_AWEME_LIST: 'GET_USER_AWEME_LIST',
  GET_USER_INFO: 'GET_USER_INFO',
  GET_AWEME_DETAILS: 'GET_AWEME_DETAILS',
  GET_TIKTOK_CREDENTIALS: 'GET_TIKTOK_CREDENTIALS',
  SELECT_FOLDER: 'SELECT_FOLDER',
  DOWNLOAD_FILE: 'DOWNLOAD_FILE',
  GET_DEFAULT_DOWNLOAD_PATH: 'GET_DEFAULT_DOWNLOAD_PATH',
  // Auto Updater
  CHECK_FOR_UPDATES: 'CHECK_FOR_UPDATES',
  DOWNLOAD_UPDATE: 'DOWNLOAD_UPDATE',
  QUIT_AND_INSTALL: 'QUIT_AND_INSTALL',
  // Auto Updater Events
  UPDATE_AVAILABLE: 'UPDATE_AVAILABLE',
  UPDATE_DOWNLOADED: 'UPDATE_DOWNLOADED',
  DOWNLOAD_PROGRESS: 'DOWNLOAD_PROGRESS',
  UPDATE_ERROR: 'UPDATE_ERROR',
  CHECKING_FOR_UPDATE: 'CHECKING_FOR_UPDATE',
  UPDATE_NOT_AVAILABLE: 'UPDATE_NOT_AVAILABLE',
  // Settings
  GET_SETTINGS: 'GET_SETTINGS',
  SAVE_SETTINGS: 'SAVE_SETTINGS'
} as const

const TIKTOK_API_URL = {
  GET_USER_AWEME_LIST: 'https://aggr22-normal-alisg.tiktokv.com/lite/v2/public/item/list/',
  GET_AWEME_DETAIL: 'https://aggr22-normal-alisg.tiktokv.com/tiktok/v1/videos/detail/',
  SEARCH_USER: 'https://search16-normal-c-alisg.tiktokv.com/aweme/v1/general/search/single/',
  GET_USER_INFO: 'https://api22-core-c-alisg.tiktokv.com/lite/v2/user/detail/other/',
  GET_TIKTOK_CREDENTIALS:
    'https://gist.githubusercontent.com/minhchi1509/f5ca73cbd389114c9928f99d6d471125/raw/tiktok-app-credentials.json'
} as const

export { IPC_CHANNELS, TIKTOK_API_URL }
