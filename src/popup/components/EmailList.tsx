import { useVirtualizer } from "@tanstack/react-virtual"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { MailMessage, Nullish } from "../../types"
import { formatTime } from "../../utils/date"
import { EmailItem, EmailItemSkeleton } from "./EmailItem"

interface EmailListProps {
  lastSyncTime?: Nullish<string>
  unreadEmailsCount?: number
  displayedEmails: MailMessage[]
  hasMore?: boolean
  isLoadingMore?: boolean
  loadMoreEmails?: () => void
  markReadLoading: Record<string, boolean>
  flagLoading: Record<string, boolean>
  markAllReadLoading: boolean
  focusedIndex?: number
  openMailDetail: (message: MailMessage, index: number) => void
  handleToggleRead: (id: string, isUnread: boolean) => void
  handleToggleFlag: (id: string, isFlagged: boolean) => void
  handleMarkAllAsRead: () => void
}

export default function EmailList({
  lastSyncTime,
  unreadEmailsCount = 0,
  displayedEmails,
  hasMore = false,
  isLoadingMore = false,
  loadMoreEmails,
  markReadLoading,
  flagLoading,
  markAllReadLoading,
  focusedIndex = -1,
  openMailDetail,
  handleToggleRead,
  handleToggleFlag,
  handleMarkAllAsRead,
}: EmailListProps) {
  "use no memo"

  const parentRef = useRef<HTMLDivElement>(null)

  // Nếu còn dữ liệu tiếp theo, thêm 1 slot cho hàng hiển thị trạng thái đang tải
  const count = hasMore ? displayedEmails.length + 1 : displayedEmails.length

  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 84,
    overscan: 6,
    useFlushSync: false,
  })

  // Cuộn tới email được chọn khi người dùng duyệt bằng phím tắt
  useEffect(() => {
    if (focusedIndex >= 0) {
      virtualizer.scrollToIndex(focusedIndex, {
        align: "auto",
        behavior: "smooth",
      })
    }
  }, [focusedIndex, virtualizer])

  // Tự động tải thêm email khi cuộn tới cuối danh sách
  const virtualItems = virtualizer.getVirtualItems()
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return

    if (
      lastItem.index >= displayedEmails.length - 4 &&
      hasMore &&
      !isLoadingMore
    ) {
      loadMoreEmails?.()
    }
  }, [
    virtualItems,
    displayedEmails.length,
    hasMore,
    isLoadingMore,
    loadMoreEmails,
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div ref={parentRef} className={cn("min-h-0 flex-1 overflow-y-auto")}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
          }}
          className="relative w-full"
        >
          {virtualItems.map((virtualItem) => {
            const isLoaderRow = virtualItem.index >= displayedEmails.length

            if (isLoaderRow) {
              return (
                <div
                  key="loader-row"
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="absolute top-0 left-0 w-full"
                >
                  <EmailItemSkeleton className="border-b" />
                </div>
              )
            }

            const msg = displayedEmails[virtualItem.index]
            return (
              <div
                key={msg.id}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="absolute top-0 left-0 w-full"
              >
                <EmailItem
                  msg={msg}
                  index={virtualItem.index}
                  isFocused={virtualItem.index === focusedIndex}
                  isMarkReadLoading={!!markReadLoading[msg.id]}
                  isFlagLoading={!!flagLoading[msg.id]}
                  openMailDetail={openMailDetail}
                  handleToggleRead={handleToggleRead}
                  handleToggleFlag={handleToggleFlag}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between bg-background px-4 py-2 text-xs text-muted-foreground outline outline-border">
        <span>
          Đồng bộ lần cuối:{" "}
          <strong className="font-semibold text-foreground">
            {formatTime(lastSyncTime)}
          </strong>
        </span>
        <Button
          variant="link"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={markAllReadLoading || !unreadEmailsCount}
        >
          {markAllReadLoading ? "Đang xử lý..." : "Đọc tất cả"}
        </Button>
      </div>
    </div>
  )
}

export function EmailListSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="divide-y">
        {Array.from({ length: 6 }).map((_, index) => (
          <EmailItemSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
