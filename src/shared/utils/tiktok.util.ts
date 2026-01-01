import { IAwemeItem, ITiktokAwemeItemStats, ITiktokVideo } from '@shared/types/tiktok.type'

const getHighestQualityVideoUri = (bitRateArr: any): string => {
  if (!Array.isArray(bitRateArr) || bitRateArr.length === 0) {
    return ''
  }
  const highestQualityVideo = bitRateArr.reduce((prev: any, current: any) => {
    const prevResolution = (prev?.play_addr?.width || 0) * (prev?.play_addr?.height || 0)
    const currentResolution = (current?.play_addr?.width || 0) * (current?.play_addr?.height || 0)
    return currentResolution > prevResolution ? current : prev
  })
  return highestQualityVideo?.play_addr?.url_list?.at(-1) || ''
}

const formatAwemeItemResponse = (item: any): IAwemeItem => {
  const id = item.aweme_id
  const url = item.share_url
  const description = item.desc
  const createdAt = item.create_time
  const type = item.image_post_info ? 'PHOTO' : 'VIDEO'
  const stats: ITiktokAwemeItemStats = {
    likes: item.statistics.digg_count,
    comments: item.statistics.comment_count,
    shares: item.statistics.share_count,
    views: item.statistics.play_count,
    collects: item.statistics.collect_count
  }
  const imagesUri =
    type === 'PHOTO'
      ? item.image_post_info.images.map((img: any) => img.display_image.url_list[0])
      : []
  const musicUri = item.music?.play_url?.url_list?.[0] || ''
  const video: ITiktokVideo | undefined =
    type === 'VIDEO'
      ? {
          coverUri: item.video.origin_cover?.url_list?.[0] || '',
          mp4Uri: getHighestQualityVideoUri(item.video.bit_rate)
        }
      : undefined
  return {
    id,
    url,
    description,
    createdAt,
    type,
    stats,
    video,
    imagesUri,
    musicUri
  }
}

export const findValueByKey = (obj: Record<string, any>, targetKey: string): any | undefined => {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue

    if (key === targetKey) {
      return obj[key] // Tìm thấy thì trả về giá trị
    }

    // Nếu là object lồng nhau thì đệ quy
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = findValueByKey(obj[key], targetKey)
      if (result !== undefined) {
        return result
      }
    }
  }

  return undefined // Không tìm thấy
}

const tiktokUtils = {
  formatAwemeItemResponse,
  findValueByKey
}

export default tiktokUtils
