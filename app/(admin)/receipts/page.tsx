/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { Search, RefreshCw, AlertCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useReceiptQueue } from '@/hooks/use-receipt-queue'
import { useRetryReceipt } from '@/hooks/use-retry-receipt'
import { useRetryAllReceipts } from '@/hooks/use-retry-all-receipts'
import type { FailedReceipt } from '@/types/api'

const PAGE_SIZE = 10

export default function ReceiptsPage() {
  const { data: receipts, isLoading } = useReceiptQueue()
  const retryOne = useRetryReceipt()
  const retryAll = useRetryAllReceipts()

  const [page, setPage] = React.useState(1)
  const allReceipts = receipts ?? []
  const total = allReceipts.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const paged = allReceipts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Retryable Failures"
        description="Failed ZK receipt writes after 3 automatic attempts. Trigger manual retries via Light Protocol CPI."
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by protocol or notification ID…"
            className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal"
            readOnly
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isLoading || retryAll.isPending || (receipts?.length ?? 0) === 0}
          onClick={() => {
            if (confirm('Retry ALL failed receipts? This will attempt a ZK write for each one.')) {
              retryAll.mutate()
            }
          }}
        >
          <RefreshCw className={retryAll.isPending ? 'animate-spin h-4 w-4' : 'h-4 w-4'} />
          Retry All {receipts && receipts.length > 0 ? `(${receipts.length})` : ''}
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-card-2 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Failure Info</th>
                <th className="px-6 py-4 font-bold text-center">Protocol</th>
                <th className="px-6 py-4 font-bold text-center">Attempts</th>
                <th className="px-6 py-4 font-bold text-center">Last Attempt</th>
                <th className="px-6 py-4 font-bold text-right pr-10">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-32 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                    </tr>
                  ))
                : total === 0
                ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-text-muted">
                        No failed receipts. ZK write queue is clear.
                      </td>
                    </tr>
                  )
                : paged.map((receipt: FailedReceipt) => (
                    <tr key={receipt.id} className="hover:bg-card-2 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-teal">{receipt.notification_id}</span>
                          <div className="flex items-center gap-1.5 text-text-secondary">
                            <AlertCircle className="h-3.5 w-3.5 text-red shrink-0" />
                            <span className="truncate max-w-[300px]">{receipt.failure_reason}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {receipt.protocol_name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={receipt.retry_count >= 3 ? 'failed' : 'developer'}>
                          {receipt.retry_count} / 3
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-text-muted">
                        <div className="flex items-center justify-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs">
                            {formatDistanceToNow(new Date(receipt.last_attempted_at), { addSuffix: true })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right pr-10">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 shadow-none"
                          disabled={retryOne.isPending}
                          onClick={() => retryOne.mutate(receipt.id)}
                        >
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!isLoading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-text-muted">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} failed receipts
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
