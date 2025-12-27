import { StyleProvider } from "@ant-design/cssinjs"
import {
  Button,
  Collapse,
  ConfigProvider,
  Divider,
  Input,
  InputNumber,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography
} from "antd"
import type { ColumnsType, ColumnType, TableProps } from "antd/es/table"
import type { FilterConfirmProps } from "antd/es/table/interface"
import downloadTiktokCssText from "data-text:./tiktok-profile-bulk-download.scss"
import antdResetCssText from "data-text:antd/dist/reset.css"
import dayjs from "dayjs"
import { PlasmoCSConfig } from "plasmo"
import { useRef, useState } from "react"
import Highlighter from "react-highlight-words"

import { showErrorToast } from "src/utils/toast.util"

import "src/components/contents/ContentToaster"

import {
  DownloadOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  StopOutlined
} from "@ant-design/icons"

import WebBulkDownloadModalFooter from "src/components/contents/WebBulkDownloadModalFooter"
import useWebsiteTheme from "src/hooks/website-theme/useWebsiteTheme"
import { ITiktokPost } from "src/interfaces/tiktok.interface"
import tiktokService from "src/services/tiktok.service"
import {
  CSUICombineCSS,
  CSUIInjectEventListenerScript,
  delay,
  downloadByBatch
} from "src/utils/common.util"
import { downloadTiktokPost, formatTiktokPost } from "src/utils/tiktok.util"

const HOST_ID = "tiktok-profile-bulk-download-minhchi1509-host-id"
const SCRIPT_LISTENER_ID = "tiktok-minhchi1509-listener-script"

const { Text, Link } = Typography

export const config: PlasmoCSConfig = {
  matches: ["https://www.tiktok.com/*"],
  run_at: "document_end"
}

export const getStyle = () => {
  return CSUICombineCSS(antdResetCssText, downloadTiktokCssText)
}

export const getShadowHostId = () => HOST_ID

export const getInlineAnchor = () => {
  const existingHost = document.querySelector(`#${HOST_ID}`)
  if (existingHost) {
    return null
  }

  return {
    element: document.querySelector('h2[data-e2e="user-subtitle"]')!,
    insertPosition: "afterend"
  }
}

CSUIInjectEventListenerScript(SCRIPT_LISTENER_ID)

const TiktokProfileBulkDownload = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fetchedTiktokPosts, setFetchedTiktokPosts] = useState<ITiktokPost[]>(
    []
  )
  const [downloadFailedPosts, setDownloadFailedPosts] = useState<ITiktokPost[]>(
    []
  )
  const [isGettingPostsData, setIsGettingPostsData] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [totalDownloadedPosts, setTotalDownloadedPosts] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [postFetchDelay, setPostFetchDelay] = useState<number>(0)
  const [fileNameFormat, setFileNameFormat] = useState<string[]>([
    "numericalOrder",
    "id"
  ])
  const [sortedAndFilteredPosts, setSortedAndFilteredPosts] = useState<
    ITiktokPost[] | null
  >(null)
  const { isDarkMode } = useWebsiteTheme("tiktok")

  const isCancelDownloadRef = useRef(false)
  const isCancelGetDataRef = useRef(false)
  const modalBodyRef = useRef<HTMLDivElement>(null)

  const totalFetchedPosts = fetchedTiktokPosts.length
  const totalDownloadedFailedPosts = downloadFailedPosts.length

  const showModal = () => {
    setIsModalOpen(true)
  }

  const getUsername = () => {
    const match = location.href.match(/tiktok\.com\/@([^\/?#]+)/)?.[1] || ""
    return match
  }

  const handleStartDownload = async () => {
    const sourcePosts = sortedAndFilteredPosts ?? fetchedTiktokPosts
    const selectedPosts = sourcePosts.filter((post) =>
      selectedRowKeys.includes(post.id)
    )

    if (selectedPosts.length === 0) return

    setIsDownloading(true)
    setTotalDownloadedPosts(0)
    setDownloadFailedPosts([])
    isCancelDownloadRef.current = false
    const userName = getUsername()

    await downloadByBatch(
      selectedPosts,
      async (post: ITiktokPost, index: number) => {
        if (isCancelDownloadRef.current) {
          setIsDownloading(false)
          return
        }
        const isSuccess = await downloadTiktokPost(post, {
          postOrderNumber: index,
          userName,
          fileNameFormat
        })
        setTotalDownloadedPosts((prevCount) => prevCount + 1)
        if (!isSuccess) {
          setDownloadFailedPosts((prevPosts) => [...prevPosts, post])
        }
      },
      10
    )
    setIsDownloading(false)
  }

  const handleStartGetPostsData = async () => {
    try {
      setIsGettingPostsData(true)
      setFetchedTiktokPosts([])
      setSortedAndFilteredPosts(null)
      setSelectedRowKeys([])
      let hasMore = true
      let cursor = "0"
      const { deviceId, secUid } = await tiktokService.getCredentials()

      while (hasMore) {
        if (isCancelGetDataRef.current) {
          setIsGettingPostsData(false)
          return
        }
        const responseData = await tiktokService.getUserPosts(
          cursor,
          deviceId,
          secUid
        )

        if (!responseData) return

        const { hasMore: newHasMore, cursor: newCursor } = responseData
        const posts = responseData.itemList || []
        const formattedPosts: ITiktokPost[] = posts.map(formatTiktokPost)
        setFetchedTiktokPosts((prevPosts) => [...prevPosts, ...formattedPosts])

        hasMore = newHasMore
        cursor = newCursor

        if (hasMore && postFetchDelay > 0) {
          await delay(postFetchDelay * 1000)
        }
      }
    } catch (error) {
      showErrorToast((error as Error).message)
    } finally {
      setIsGettingPostsData(false)
    }
  }

  const handleCancelGetData = () => {
    isCancelGetDataRef.current = true
    setIsGettingPostsData(false)
  }

  const handleCancelDownload = () => {
    isCancelDownloadRef.current = true
    setIsDownloading(false)
  }

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys)
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    onSelectAll: (
      selected: boolean,
      selectedRows: ITiktokPost[],
      changeRows: ITiktokPost[]
    ) => {
      if (selected) {
        setSelectedRowKeys(fetchedTiktokPosts.map((post) => post.id))
      } else {
        setSelectedRowKeys([])
      }
    },
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE
    ],
    getCheckboxProps: (record: ITiktokPost) => ({
      disabled: isDownloading,
      name: record.id
    })
  }

  const [searchText, setSearchText] = useState("")
  const [searchedColumn, setSearchedColumn] = useState("")
  const searchInput = useRef<any>(null)

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: keyof ITiktokPost
  ) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  const handleReset = (clearFilters: () => void) => {
    clearFilters()
    setSearchText("")
  }

  const handleTableChange: TableProps<ITiktokPost>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    if (extra.currentDataSource) {
      setSortedAndFilteredPosts(extra.currentDataSource)
    }
  }

  const getColumnSearchProps = (
    dataIndex: keyof ITiktokPost
  ): ColumnType<ITiktokPost> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
            }
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}>
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}>
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false })
              setSearchText((selectedKeys as string[])[0])
              setSearchedColumn(dataIndex)
            }}>
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close()
            }}>
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      String(record[dataIndex] ?? "")
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100)
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      )
  })

  const columns: ColumnsType<ITiktokPost> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 180,
      ...getColumnSearchProps("id"),
      render: (text) => (
        <Text copyable>
          {searchedColumn === "id" ? (
            <Highlighter
              highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ""}
            />
          ) : (
            text
          )}
        </Text>
      )
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 80,
      filters: [
        { text: "PHOTO", value: "PHOTO" },
        { text: "VIDEO", value: "VIDEO" }
      ],
      onFilter: (value, record) => record.type === value,
      render: (type) => (
        <Tag color={type === "PHOTO" ? "blue" : "orange"}>{type}</Tag>
      )
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: 60,
      align: "center",
      render: (url) => (
        <Link href={url} target="_blank">
          <LinkOutlined />
        </Link>
      )
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 200,
      ...getColumnSearchProps("description"),
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ width: 180 }}>
            {searchedColumn === "description" ? (
              <Highlighter
                highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={text ? text.toString() : ""}
              />
            ) : (
              text
            )}
          </Text>
        </Tooltip>
      )
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      sorter: (a, b) => a.createdAt - b.createdAt,
      render: (text) => dayjs(text * 1000).format("DD/MM/YYYY HH:mm:ss")
    },
    {
      title: "Likes",
      dataIndex: ["stats", "likes"],
      key: "likes",
      width: 100,
      sorter: (a, b) => a.stats.likes - b.stats.likes,
      render: (val) => Number(val).toLocaleString()
    },
    {
      title: "Comments",
      dataIndex: ["stats", "comments"],
      key: "comments",
      width: 100,
      sorter: (a, b) => a.stats.comments - b.stats.comments,
      render: (val) => Number(val).toLocaleString()
    },
    {
      title: "Views",
      dataIndex: ["stats", "views"],
      key: "views",
      width: 100,
      sorter: (a, b) => a.stats.views - b.stats.views,
      render: (val) => Number(val).toLocaleString()
    },
    {
      title: "Collects",
      dataIndex: ["stats", "collects"],
      key: "collects",
      width: 100,
      sorter: (a, b) => a.stats.collects - b.stats.collects,
      render: (val) => Number(val).toLocaleString()
    }
  ]

  const selectedCount = selectedRowKeys.length

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm
      }}
      getPopupContainer={(node) =>
        modalBodyRef.current || node?.parentElement || document.body
      }>
      <StyleProvider
        hashPriority="high"
        container={document.querySelector(`#${HOST_ID}`)?.shadowRoot!}>
        <Button type="primary" onClick={showModal}>
          Download
        </Button>
        <Modal
          destroyOnClose
          title="Tiktok Bulk Downloader"
          centered
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          onOk={() => setIsModalOpen(false)}
          footer={null}
          width={1000}
          styles={{
            mask: {
              backdropFilter: "blur(8px)"
            }
          }}
          getContainer={
            document
              .querySelector(`#${HOST_ID}`)
              ?.shadowRoot!.querySelector(
                "#plasmo-shadow-container"
              ) as HTMLElement
          }
          rootClassName="tiktok-profile-bulk-download-modal-root">
          <div
            ref={modalBodyRef}
            style={
              {
                padding: "20px 0 0 0",
                "--background-scrollbar-thumb": isDarkMode ? "#555" : "#ccc"
              } as React.CSSProperties
            }>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* User Info & Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                <Space direction="vertical" size={2}>
                  <div>
                    <Text strong>Username: </Text>
                    <Text code>{getUsername()}</Text>
                  </div>
                  <div>
                    <Text strong>Posts Retrieved: </Text>
                    <Text style={{ fontSize: "16px", color: "#1890ff" }}>
                      {totalFetchedPosts}
                    </Text>
                  </div>
                </Space>

                <Space>
                  <Space>
                    <Text strong>Delay between requests (s):</Text>
                    <InputNumber
                      min={0}
                      step={0.1}
                      value={postFetchDelay}
                      onChange={(value) => setPostFetchDelay(value || 0)}
                      disabled={isGettingPostsData || isDownloading}
                      style={{ width: 70 }}
                    />
                  </Space>
                  {!isDownloading && (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={handleStartGetPostsData}
                      loading={isGettingPostsData}>
                      {fetchedTiktokPosts.length > 0
                        ? "Get posts data again"
                        : "Start getting posts data"}
                    </Button>
                  )}

                  {isGettingPostsData && (
                    <Button
                      danger
                      icon={<StopOutlined />}
                      onClick={handleCancelGetData}>
                      Cancel getting posts data
                    </Button>
                  )}
                </Space>
              </div>

              <Divider style={{ margin: 0 }} />

              {/* Table Selection & Download Action */}
              <div className="flex justify-between items-center">
                <Text strong>Selected: {selectedCount}</Text>
                <Space size="middle">
                  <Space align="center">
                    <Text strong>File name format:</Text>
                    <Select
                      mode="multiple"
                      allowClear
                      style={{ width: 400 }}
                      placeholder="Select format"
                      value={fileNameFormat}
                      onChange={setFileNameFormat}
                      options={[
                        { label: "Numerical Order", value: "numericalOrder" },
                        { label: "ID", value: "id" },
                        { label: "Description", value: "description" },
                        { label: "Timestamp", value: "timestamp" }
                      ]}
                    />
                  </Space>
                  {isDownloading ? (
                    <Button
                      danger
                      icon={<StopOutlined />}
                      onClick={handleCancelDownload}>
                      Stop downloading
                    </Button>
                  ) : (
                    <Button
                      type="default"
                      icon={<DownloadOutlined />}
                      onClick={handleStartDownload}
                      disabled={selectedCount === 0 || isGettingPostsData}
                      loading={isDownloading}>
                      Start downloading ({selectedCount})
                    </Button>
                  )}
                </Space>
              </div>

              {/* Progress Bar */}
              {isDownloading && (
                <div className="flex gap-2 items-center w-full">
                  <Progress
                    percent={Math.round(
                      (totalDownloadedPosts / selectedCount) * 100
                    )}
                    status={
                      totalDownloadedPosts === selectedCount
                        ? "success"
                        : "active"
                    }
                  />
                  <Text strong className="text-nowrap">
                    ({totalDownloadedPosts}/{selectedCount})
                  </Text>
                </div>
              )}

              {/* Completion Message */}
              {!isDownloading &&
                totalDownloadedPosts > 0 &&
                totalDownloadedPosts === selectedCount && (
                  <div className="w-full flex flex-col justify-center items-center gap-2">
                    <Text
                      style={{
                        color: "#52c41a",
                        fontWeight: "bold",
                        textAlign: "center"
                      }}>
                      Download completed!
                    </Text>
                    <div className="flex gap-6">
                      <Text style={{ color: "#52c41a", fontWeight: "bold" }}>
                        Success:{" "}
                        {totalDownloadedPosts - totalDownloadedFailedPosts}
                      </Text>
                      <Text style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                        Failed: {totalDownloadedFailedPosts}
                      </Text>
                    </div>
                  </div>
                )}

              {/* Failed Items */}
              {downloadFailedPosts.length > 0 && (
                <Collapse
                  items={[
                    {
                      key: "1",
                      label: "Failed Downloaded Items",
                      children: (
                        <div className="max-h-[150px] overflow-auto flex flex-col gap-2">
                          {downloadFailedPosts.map((post, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1">
                              <span>{index + 1}.</span>
                              <span className="font-bold">{post.id}</span>
                              <a
                                href={post.url}
                                className="text-[#1890ff]"
                                target="_blank"
                                rel="noopener noreferrer">
                                (See post)
                              </a>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  ]}
                />
              )}

              {/* Data Table */}
              <Table
                onChange={handleTableChange}
                rowSelection={rowSelection}
                columns={columns}
                dataSource={fetchedTiktokPosts}
                rowKey="id"
                pagination={{
                  defaultPageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                  style: {
                    marginBottom: 0
                  }
                }}
                scroll={{ y: "calc(100vh - 500px)" }}
                size="small"
              />

              <Divider style={{ margin: 0 }} />

              <WebBulkDownloadModalFooter isDarkMode={isDarkMode} />
            </Space>
          </div>
        </Modal>
      </StyleProvider>
    </ConfigProvider>
  )
}

export default TiktokProfileBulkDownload
