const IPC_CHANNELS = {
  GET_USER_AWEME_LIST: 'GET_USER_AWEME_LIST',
  GET_USER_INFO: 'GET_USER_INFO',
  GET_AWEME_DETAILS: 'GET_AWEME_DETAILS',
  GET_TIKTOK_CREDENTIALS: 'GET_TIKTOK_CREDENTIALS',
  SELECT_FOLDER: 'SELECT_FOLDER',
  DOWNLOAD_FILE: 'DOWNLOAD_FILE'
} as const

const TIKTOK_API_URL = {
  GET_USER_AWEME_LIST: 'https://aggr22-normal-alisg.tiktokv.com/lite/v2/public/item/list/',
  GET_AWEME_DETAIL: 'https://aggr22-normal-alisg.tiktokv.com/aweme/v1/aweme/detail/',
  GET_USER_DETAILS: 'https://aggr22-normal-alisg.tiktokv.com/aweme/v1/discover/search/',
  GET_TIKTOK_CREDENTIALS:
    'https://gist.githubusercontent.com/minhchi1509/96e7a0a0ecb2ff5035ee1a34a1c3cdf7/raw/tiktok-credentials.json'
} as const

export { IPC_CHANNELS, TIKTOK_API_URL }
