import { Button, Input, Select, SelectItem, Card, CardBody, Image, Chip } from '@heroui/react'
import { useState } from 'react'
import { FolderOpen, Download, Search } from 'lucide-react'
import { IAwemeItem } from '@shared/types/tiktok.type'

const SingleDownloader = () => {
  const [postId, setPostId] = useState('')
  const [folderPath, setFolderPath] = useState('')
  const [fileNameFormat, setFileNameFormat] = useState('ID')
  const [loading, setLoading] = useState(false)
  const [downloadedItem, setDownloadedItem] = useState<IAwemeItem | null>(null)

  const handleSelectFolder = async () => {
    const path = await window.api.selectFolder()
    if (path) setFolderPath(path)
  }

  const sanitizeFilename = (name: string) => {
    return name ? name.replace(/[^a-z0-9]/gi, '_').substring(0, 50) : 'no_desc'
  }

  const getFilename = (item: IAwemeItem, _index: number, ext: string) => {
    const date = new Date(item.createdAt * 1000).toISOString().split('T')[0]
    switch (fileNameFormat) {
      case 'Numerical order_ID':
        return `${item.id}.${ext}` // Single item doesn't have order really, just ID
      case 'ID':
        return `${item.id}.${ext}`
      case 'Description':
        return `${sanitizeFilename(item.description)}.${ext}`
      case 'Timestamp':
        return `${date}_${item.id}.${ext}`
      default:
        return `${item.id}.${ext}`
    }
  }

  const handleDownload = async () => {
    if (!postId) return
    setLoading(true)
    setDownloadedItem(null)
    try {
      // 1. Get Credentials
      const creds = await window.api.getCredentials()

      // 2. Get Details
      const item = await window.api.getAwemeDetails(postId, { cookie: creds.cookie })

      if (!item) {
        alert('Could not find video with that ID')
        setLoading(false)
        return
      }

      // 3. Download
      const targetFolder = folderPath || (await window.api.selectFolder())
      if (!targetFolder) {
        setLoading(false)
        return
      }
      setFolderPath(targetFolder)

      if (item.type === 'VIDEO' && item.video) {
        await window.api.downloadFile({
          url: item.video.mp4Uri,
          fileName: getFilename(item, 0, 'mp4'),
          folderPath: targetFolder
        })
      } else if (item.type === 'PHOTO' && item.imagesUri) {
        for (let j = 0; j < item.imagesUri.length; j++) {
          await window.api.downloadFile({
            url: item.imagesUri[j],
            fileName: getFilename(item, 0, `jpg`).replace('.jpg', `_${j + 1}.jpg`),
            folderPath: targetFolder
          })
        }
      }

      setDownloadedItem(item)
      alert('Download Successful!')
    } catch (e) {
      console.error(e)
      alert('Download failed: ' + e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto mt-10 p-6 bg-content1 rounded-xl shadow-lg border border-divider">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Single Video Download
          </h2>
          <p className="text-default-500">Enter a video ID to download immediately.</p>
        </div>

        <Input
          label="Tiktok Video ID"
          placeholder="Enter video ID (e.g. 744900...)"
          value={postId}
          onValueChange={setPostId}
          variant="bordered"
          size="lg"
          startContent={<Search className="text-default-400" />}
        />

        <div className="flex gap-4">
          <Input
            label="Save Location"
            value={folderPath}
            readOnly
            placeholder="Default: Downloads"
            className="flex-1"
            variant="bordered"
            endContent={
              <FolderOpen
                className="text-default-400 cursor-pointer hover:text-primary"
                onClick={handleSelectFolder}
              />
            }
          />
          <Select
            label="Filename Format"
            className="w-48"
            defaultSelectedKeys={['ID']}
            onSelectionChange={(keys) => setFileNameFormat(Array.from(keys)[0] as string)}
            variant="bordered"
          >
            <SelectItem key="ID">ID</SelectItem>
            <SelectItem key="Description">Description</SelectItem>
            <SelectItem key="Timestamp">Timestamp</SelectItem>
          </Select>
        </div>

        <Button
          color="primary"
          isLoading={loading}
          onPress={handleDownload}
          className="w-full font-bold text-md"
          size="lg"
          startContent={!loading && <Download />}
        >
          {loading ? 'Processing...' : 'Download Now'}
        </Button>

        {downloadedItem && (
          <Card className="mt-4 bg-success-50 dark:bg-success-900/20 border-success-200">
            <CardBody className="flex flex-row gap-4 items-center">
              <Image
                src={downloadedItem.video?.coverUri || downloadedItem.imagesUri?.[0]}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Download Complete!</span>
                  <Chip size="sm" color="success" variant="flat">
                    {downloadedItem.type}
                  </Chip>
                </div>
                <span className="text-small text-default-500 line-clamp-1">
                  {downloadedItem.description}
                </span>
                <span className="text-tiny text-default-400">ID: {downloadedItem.id}</span>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}

export default SingleDownloader
