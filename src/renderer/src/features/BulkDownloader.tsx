import {
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Progress,
  Tooltip,
  Pagination,
  Checkbox,
  cn
} from '@heroui/react'
import {
  SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn
} from '@tanstack/react-table'
import { useState, useMemo, useRef } from 'react'
import { IAwemeItem, IUserInfo } from '@shared/types/tiktok.type'
import {
  Search,
  Download,
  FolderOpen,
  StopCircle,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ArrowDownUp
} from 'lucide-react'

const columnHelper = createColumnHelper<IAwemeItem>()

const BulkDownloader = () => {
  const [username, setUsername] = useState('')
  const [delay, setDelay] = useState('0')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<IUserInfo | null>(null)
  const [posts, setPosts] = useState<IAwemeItem[]>([])

  // Fetch State
  const isCancelGetDataRef = useRef(false)
  const isCancelDownloadRef = useRef(false)

  // Table State
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<{ id: string; value: unknown }[]>([])

  // Pagination State
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Download State
  const [folderPath, setFolderPath] = useState('')
  // Using Set to handle multiple selections for filename format
  const [fileNameFormat, setFileNameFormat] = useState<Set<string>>(
    new Set(['Numerical order', 'ID'])
  )
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })

  // Custom Filter Function
  const customFilterFn: FilterFn<IAwemeItem> = (row, columnId, filterValue) => {
    const rowValue = row.getValue(columnId) as string
    if (!filterValue) return true
    return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase())
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        // Enable column filtering
        filterFn: customFilterFn,
        enableSorting: false,
        cell: (info) => <span className="text-small font-bold">{info.getValue()}</span>
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        filterFn: (row, id, value) => {
          return !value || value === 'ALL' || row.getValue(id) === value
        },
        enableSorting: false,
        cell: (info) => (
          <Chip
            size="sm"
            color={info.getValue() === 'VIDEO' ? 'primary' : 'secondary'}
            variant="flat"
          >
            {info.getValue()}
          </Chip>
        )
      }),
      columnHelper.accessor('url', {
        header: 'Url',
        enableSorting: false,
        cell: (info) => (
          <a
            href={info.getValue()}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:text-primary-500"
          >
            <ExternalLink size={16} />
          </a>
        )
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        filterFn: customFilterFn,
        enableSorting: false,
        cell: (info) => (
          <Tooltip content={info.getValue()} delay={1000}>
            <div className="w-40 truncate text-tiny cursor-default">{info.getValue()}</div>
          </Tooltip>
        )
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created At',
        cell: (info) => (
          <span className="text-tiny text-default-500">
            {info.getValue() ? new Date(info.getValue() * 1000).toLocaleString() : '-'}
          </span>
        )
      }),
      columnHelper.accessor('stats.likes', {
        header: 'Likes',
        cell: (info) => (
          <span className="text-tiny">❤️ {Number(info.getValue()).toLocaleString()}</span>
        )
      }),
      columnHelper.accessor('stats.comments', {
        header: 'Comments',
        cell: (info) => (
          <span className="text-tiny">💬 {Number(info.getValue()).toLocaleString()}</span>
        )
      }),
      columnHelper.accessor('stats.views', {
        header: 'Views',
        cell: (info) => (
          <span className="text-tiny">👁️ {Number(info.getValue()).toLocaleString()}</span>
        )
      }),
      columnHelper.accessor('stats.collects', {
        header: 'Collects',
        cell: (info) => (
          <span className="text-tiny">📌 {Number(info.getValue()).toLocaleString()}</span>
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data: posts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex,
        pageSize
      }
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize })
        setPageIndex(newState.pageIndex)
        setPageSize(newState.pageSize)
      } else {
        setPageIndex(updater.pageIndex)
        setPageSize(updater.pageSize)
      }
    },
    enableRowSelection: true
  })

  // Fetch Logic
  const handleFetchData = async () => {
    if (!username) return

    // Toggle Loading
    if (loading) {
      // User clicked cancel
      isCancelGetDataRef.current = true
      setLoading(false)
      return
    }

    setLoading(true)
    isCancelGetDataRef.current = false

    setPosts([])
    setPageIndex(0)

    try {
      const creds = await window.api.getCredentials()
      const user = await window.api.getUserInfo(username)
      setUserInfo(user)

      let currentCursor = '0'
      let currentMaxCursor = '0'
      let hasMore = true

      while (hasMore && !isCancelGetDataRef.current) {
        const res = await window.api.getUserAwemeList(user.secUid, {
          cursor: currentCursor,
          maxCursor: currentMaxCursor,
          cookie: creds.cookie
        })

        setPosts((prev) => [...prev, ...res.awemeList])
        currentCursor = res.pagination.cursor
        currentMaxCursor = res.pagination.maxCursor
        hasMore = res.pagination.hasMore

        // Handling delay
        const delayMs = parseInt(delay) || 0
        if (delayMs > 0 && hasMore) await new Promise((r) => setTimeout(r, delayMs))
      }
    } catch (error) {
      console.error(error)
      alert('Failed to fetch data: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFolder = async () => {
    const path = await window.api.selectFolder()
    if (path) setFolderPath(path)
  }

  // Download Logic
  const sanitizeFilename = (name: string) => {
    return name ? name.replace(/[^a-z0-9]/gi, '_').substring(0, 50) : 'no_desc'
  }

  const getFilename = (item: IAwemeItem, index: number, ext: string) => {
    const date = new Date(item.createdAt * 1000).toISOString().split('T')[0]
    const formatKeys = Array.from(fileNameFormat)

    const parts: string[] = []

    if (formatKeys.includes('Numerical order')) parts.push(`${index + 1}`)
    if (formatKeys.includes('ID')) parts.push(item.id)
    if (formatKeys.includes('Timestamp')) parts.push(date)
    if (formatKeys.includes('Description')) parts.push(sanitizeFilename(item.description))

    return parts.length > 0 ? `${parts.join('_')}.${ext}` : `${item.id}.${ext}`
  }

  const handleDownload = async () => {
    const selectedIndices = Object.keys(rowSelection)
    if (selectedIndices.length === 0) {
      alert('Please select items to download')
      return
    }

    if (!folderPath) {
      const defaultPath = await window.api.selectFolder()
      if (!defaultPath) return
      setFolderPath(defaultPath)
    }

    setDownloading(true)
    isCancelDownloadRef.current = false
    setDownloadProgress({ current: 0, total: selectedIndices.length })

    const selectedItems = selectedIndices.map((i) => posts[parseInt(i)])
    const targetFolder = folderPath || (await window.api.selectFolder()) || ''

    if (!targetFolder) {
      setDownloading(false)
      return
    }

    for (let i = 0; i < selectedItems.length; i++) {
      if (isCancelDownloadRef.current) break

      const item = selectedItems[i]
      const indexForName = i
      const delayMs = parseInt(delay) || 0

      try {
        if (item.type === 'VIDEO' && item.video) {
          await window.api.downloadFile({
            url: item.video.mp4Uri,
            fileName: getFilename(item, indexForName, 'mp4'),
            folderPath: targetFolder
          })
        } else if (item.type === 'PHOTO' && item.imagesUri) {
          for (let j = 0; j < item.imagesUri.length; j++) {
            await window.api.downloadFile({
              url: item.imagesUri[j],
              fileName: getFilename(item, indexForName, `jpg`).replace('.jpg', `_${j + 1}.jpg`),
              folderPath: targetFolder
            })
          }
        }
      } catch (e) {
        console.error(`Failed to download ${item.id}`, e)
      }

      setDownloadProgress((prev) => ({ ...prev, current: prev.current + 1 }))
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
    }
    setDownloading(false)
  }

  return (
    <div className="flex flex-col gap-4 h-full relative p-2">
      {/* Input Section */}
      <div className="flex gap-4 items-end bg-content1 p-4 rounded-lg shadow-sm border border-divider">
        <Input
          label="Username"
          value={username}
          onValueChange={setUsername}
          className="max-w-xs"
          variant="bordered"
          size="sm"
          isDisabled={loading}
        />
        <Input
          label="Delay (ms)"
          value={delay}
          onValueChange={setDelay}
          className="w-24"
          type="number"
          variant="bordered"
          size="sm"
          isDisabled={loading}
        />
        <Button
          color={loading ? 'danger' : 'primary'}
          onPress={handleFetchData}
          startContent={!loading ? <Search size={18} /> : <StopCircle size={18} />}
        >
          {loading ? 'Stop Fetching' : 'Get Data'}
        </Button>
        <div className="ml-auto text-small text-default-500">
          {userInfo && (
            <div className="flex gap-4">
              <span>
                <b>@{userInfo.uniqueId}</b>
              </span>
              <span>Posts: {posts.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col gap-4">
        {/* Toolbar with Filters */}
        <div className="flex justify-between items-center bg-content1 p-2 rounded-lg border border-divider flex-wrap gap-2">
          <div className="flex gap-2 items-center flex-1">
            {/* ID Search Filter */}
            <Input
              placeholder="Filter ID..."
              value={(table.getColumn('id')?.getFilterValue() as string) ?? ''}
              onValueChange={(val) => table.getColumn('id')?.setFilterValue(val)}
              startContent={<Search size={14} />}
              size="sm"
              className="w-32"
            />
            {/* Description Search Filter */}
            <Input
              placeholder="Filter Description..."
              value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
              onValueChange={(val) => table.getColumn('description')?.setFilterValue(val)}
              startContent={<Search size={14} />}
              size="sm"
              className="w-48"
            />
            {/* Type Filter */}
            <Select
              placeholder="Type"
              size="sm"
              className="w-24"
              selectedKeys={[(table.getColumn('type')?.getFilterValue() as string) || 'ALL']}
              onChange={(e) => table.getColumn('type')?.setFilterValue(e.target.value)}
            >
              <SelectItem key="ALL">All</SelectItem>
              <SelectItem key="VIDEO">Video</SelectItem>
              <SelectItem key="PHOTO">Photo</SelectItem>
            </Select>
          </div>

          {/* Download Configuration */}
          <div className="flex gap-2 items-center">
            <Tooltip delay={0} content={folderPath} placement="top" isDisabled={!folderPath}>
              <Input
                placeholder="Save to..."
                value={folderPath}
                readOnly
                size="sm"
                className="w-40"
                classNames={{
                  input: 'truncate'
                }}
                endContent={
                  <FolderOpen
                    size={16}
                    className="cursor-pointer hover:text-primary"
                    onClick={handleSelectFolder}
                  />
                }
              />
            </Tooltip>

            <Select
              placeholder="Filename Format"
              selectionMode="multiple"
              selectedKeys={fileNameFormat}
              onSelectionChange={(keys) => setFileNameFormat(keys as Set<string>)}
              className="w-96"
              size="sm"
              renderValue={(items) => (
                <div className="flex flex-wrap items-center gap-1">
                  {items.map((item, index) => (
                    <div key={item.key} className="flex items-center gap-1">
                      <Chip size="sm" variant="flat" color="success">
                        {item.textValue}
                      </Chip>

                      {/* separator "_" (không render cho item cuối) */}
                      {index < items.length - 1 && <span className="text-default-400">_</span>}
                    </div>
                  ))}
                </div>
              )}
            >
              <SelectItem key="Numerical order">Numerical Order</SelectItem>
              <SelectItem key="ID">ID</SelectItem>
              <SelectItem key="Description">Description</SelectItem>
              <SelectItem key="Timestamp">Timestamp</SelectItem>
            </Select>

            <Button
              size="sm"
              color={downloading ? 'danger' : 'success'}
              onPress={downloading ? () => (isCancelDownloadRef.current = true) : handleDownload}
              startContent={downloading ? <StopCircle size={16} /> : <Download size={16} />}
              isDisabled={Object.keys(rowSelection).length === 0}
            >
              {downloading ? `Stop` : `Download (${Object.keys(rowSelection).length})`}
            </Button>
          </div>
        </div>

        {downloading && (
          <div className="w-full px-1">
            <div className="flex justify-between text-tiny mb-1">
              <span>Downloading...</span>
              <span>
                {downloadProgress.current} / {downloadProgress.total}
              </span>
            </div>
            <Progress
              value={(downloadProgress.current / downloadProgress.total) * 100}
              size="sm"
              color="success"
              className="w-full"
            />
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto border rounded-lg border-divider custom-scrollbar relative bg-content1/50">
          <table className="min-w-full text-left text-sm w-full">
            <thead className="bg-default-100 sticky top-0 z-20 shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  <th className="p-3 w-10 bg-default-100">
                    <Checkbox
                      disabled={downloading}
                      size="sm"
                      isIndeterminate={table.getIsSomeRowsSelected()}
                      isSelected={table.getIsAllRowsSelected()}
                      onChange={table.getToggleAllRowsSelectedHandler()}
                      classNames={{
                        wrapper: 'before:border-default-400'
                      }}
                    />
                  </th>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'p-3 font-semibold text-default-600 transition-colors bg-default-100 whitespace-nowrap',
                        header.column.getCanSort()
                          ? 'cursor-pointer hover:text-primary'
                          : 'cursor-default'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() &&
                          ({ asc: <ArrowUp size={15} />, desc: <ArrowDown size={15} /> }[
                            header.column.getIsSorted() as string
                          ] ?? <ArrowDownUp size={15} />)}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-divider">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'transition-colors group',
                      row.getIsSelected()
                        ? 'bg-primary-50 dark:bg-primary-100/60'
                        : 'hover:bg-default-100'
                    )}
                  >
                    <td className="p-3">
                      <Checkbox
                        disabled={downloading}
                        size="sm"
                        isSelected={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        classNames={{
                          wrapper: 'before:border-default-400'
                        }}
                      />
                    </td>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="p-10 text-center text-default-500">
                    {loading && posts.length === 0
                      ? 'Fetching user info and posts...'
                      : 'No data found. Enter a username to fetch.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-2 bg-content1 rounded-lg border border-divider">
          <div className="text-small text-default-500">Total {posts.length} items</div>

          <Pagination
            showControls
            total={table.getPageCount()}
            initialPage={1}
            page={pageIndex + 1}
            onChange={(page) => setPageIndex(page - 1)}
            siblings={1}
            boundaries={1}
          />

          <Select
            size="sm"
            className="w-24"
            selectedKeys={[String(pageSize)]}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Rows per page"
          >
            <SelectItem key="10">10 / page</SelectItem>
            <SelectItem key="20">20 / page</SelectItem>
            <SelectItem key="50">50 / page</SelectItem>
            <SelectItem key="100">100 / page</SelectItem>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default BulkDownloader
