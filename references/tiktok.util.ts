import sanitize from "sanitize-filename"

import { ITiktokPost, ITiktokVideo } from "src/interfaces/tiktok.interface"
import {
  delay,
  downloadByBatch,
  downloadFileFromWebpage,
  downloadForbiddenMedia
} from "src/utils/common.util"

export const formatTiktokPost = (post: any): ITiktokPost => {
  const postId = post.id
  const authorUsername = post.author?.uniqueId || "unknown_user"
  const postType = post.imagePost ? "PHOTO" : "VIDEO"
  const postCreatedAt = post.createTime
  const postDescription = post.desc
  const musicUri = post?.music?.playUrl
  const likeCount = +post.statsV2?.diggCount || 0
  const commentCount = +post.statsV2?.commentCount || 0
  const shareCount = +post.statsV2?.shareCount || 0
  const viewCount = +post.statsV2?.playCount || 0
  const collectCount = +post.statsV2?.collectCount || 0

  const baseResponse: ITiktokPost = {
    id: postId,
    url: `https://www.tiktok.com/@${authorUsername}/${postType.toLowerCase()}/${postId}`,
    description: postDescription,
    createdAt: postCreatedAt,
    type: postType,
    musicUri,
    stats: {
      likes: likeCount,
      comments: commentCount,
      shares: shareCount,
      views: viewCount,
      collects: collectCount
    }
  }
  if (postType === "PHOTO") {
    const imagesUri: string[] = post.imagePost.images.map(
      (v: any) => v.imageURL.urlList[0]
    )
    return {
      ...baseResponse,
      imagesUri
    }
  } else {
    // Lấy URL video từ bitrateInfo với chất lượng cao nhất
    let videoUri = `https://www.tikwm.com/video/media/hdplay/${postId}.mp4` // fallback URL

    if (post.video?.bitrateInfo && Array.isArray(post.video.bitrateInfo)) {
      // Tìm video có resolution cao nhất (width * height)
      const highestQualityVideo = post.video.bitrateInfo.reduce(
        (prev: any, current: any) => {
          const prevResolution =
            (prev?.PlayAddr?.Width || 0) * (prev?.PlayAddr?.Height || 0)
          const currentResolution =
            (current?.PlayAddr?.Width || 0) * (current?.PlayAddr?.Height || 0)
          return currentResolution > prevResolution ? current : prev
        }
      )

      // Lấy URL đầu tiên từ UrlList
      if (
        highestQualityVideo?.PlayAddr?.UrlList &&
        highestQualityVideo.PlayAddr.UrlList.length > 0
      ) {
        videoUri = highestQualityVideo.PlayAddr.UrlList[0]
      }
    } else if (post.video?.playAddr) {
      // Fallback to old structure if bitrateInfo is not available
      videoUri = post.video.playAddr
    }

    const video: ITiktokVideo = {
      coverUri: post.video?.cover || "",
      mp4Uri: videoUri
    }
    return {
      ...baseResponse,
      video
    }
  }
}

const downloadTiktokMedia = async (
  type: "PHOTO" | "VIDEO",
  mediaUrl: string,
  filename: string
) => {
  if (!mediaUrl) {
    return false
  }

  const MAX_RETRIES = 5
  const RETRY_DELAY = 500 // ms

  let retryCount = 0

  while (retryCount <= MAX_RETRIES) {
    try {
      const isThirdPartyUrlDownload = new URL(mediaUrl).host.includes(
        "tikwm.com"
      )

      if (type === "PHOTO" || isThirdPartyUrlDownload) {
        await downloadFileFromWebpage({
          url: mediaUrl,
          filename
        })
      } else {
        await downloadForbiddenMedia(mediaUrl, filename)
      }
      return true
    } catch (error) {
      if (retryCount === MAX_RETRIES) {
        console.error(
          `❌❌❌ Failed to download tiktok media after ${MAX_RETRIES} retries`,
          {
            mediaUrl,
            filename,
            error
          }
        )
        return false
      }

      retryCount++
      await delay(RETRY_DELAY)
    }
  }
}

const getFilename = (
  tiktokPost: ITiktokPost,
  postOrderNumber: number,
  fileNameFormat: string[]
) => {
  if (!fileNameFormat || fileNameFormat.length === 0) {
    return sanitize(`${postOrderNumber}_${tiktokPost.id}`)
  }

  const parts = fileNameFormat.map((format) => {
    switch (format) {
      case "numericalOrder":
        return postOrderNumber
      case "id":
        return tiktokPost.id
      case "description":
        return tiktokPost.description ? sanitize(tiktokPost.description) : ""
      case "timestamp":
        return tiktokPost.createdAt
      default:
        return ""
    }
  })

  // Remove empty parts and join by underscore
  const filename = parts.filter((part) => part !== "").join("_")
  return sanitize(filename) || sanitize(`${postOrderNumber}_${tiktokPost.id}`)
}

export const downloadTiktokPost = async (
  tiktokPost: ITiktokPost,
  {
    postOrderNumber = 0,
    userName = "",
    fileNameFormat = ["numericalOrder", "id"],
    isDownloadDetail = false
  }: {
    postOrderNumber?: number
    userName?: string
    fileNameFormat?: string[]
    isDownloadDetail?: boolean
  }
) => {
  let isSuccess: boolean | undefined = true
  const basePath = isDownloadDetail
    ? "tiktok_downloader"
    : `tiktok_downloader/${userName}`

  const filenameBase = isDownloadDetail
    ? tiktokPost.id
    : getFilename(tiktokPost, postOrderNumber, fileNameFormat)

  if (
    tiktokPost.type === "PHOTO" &&
    tiktokPost.imagesUri &&
    tiktokPost.imagesUri?.length > 0
  ) {
    const totalImages = tiktokPost.imagesUri.length
    if (totalImages === 1) {
      const imageUri = tiktokPost.imagesUri[0]
      const filename = `${basePath}/${filenameBase}.jpg`
      isSuccess = await downloadTiktokMedia(tiktokPost.type, imageUri, filename)
    } else {
      await downloadByBatch(
        tiktokPost.imagesUri,
        async (imageUri: string, index: number) => {
          const filename = `${basePath}/${filenameBase}/${index}.jpg`
          const isDownloadSuccess = await downloadTiktokMedia(
            tiktokPost.type,
            imageUri,
            filename
          )
          isSuccess = isSuccess && isDownloadSuccess
        },
        5
      )
    }
    return isSuccess
  }
  if (tiktokPost.type === "VIDEO" && tiktokPost.video) {
    const videoUri = tiktokPost.video.mp4Uri
    const filename = `${basePath}/${filenameBase}.mp4`
    isSuccess = await downloadTiktokMedia(tiktokPost.type, videoUri, filename)
    return isSuccess
  }
}
