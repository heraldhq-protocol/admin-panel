/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/use-notifications'
import { truncateHash, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { NotificationStatus, NotificationCategory, Notification } from '@/types/api'

const STATUS_OPTIONS: NotificationStatus[] = ['queued', 'processing', 'delivered', 'failed', 'opted_out']
const CATEGORY_OPTIONS: NotificationCategory[] = ['defi', 'governance', 'system', 'marketing']

export default function NotificationsPage() {
  const router = useRouter()

  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<NotificationStatus | ''>('')
  const [category, setCategory] = React.useState<NotificationCategory | ''>('')

  const { data, isLoading } = useNotifications({
    page,
    per_page: 50,
    status: status || undefined,
    category: category || undefined,
    protocol_id: search.length > 5 ? search : undefined,
  })

  const handleExport = () => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (category) params.set('category', category)
    if (search.length > 5) params.set('protocol_id', search)
    const query = params.toString()
    window.open(`/api/admin/notifications/export${query ? `?${query}` : ''}`, '_blank')
  }

  const toggleStatus = (s: NotificationStatus) => {
    setStatus((prev) => (prev === s ? '' : s))
    setPage(1)
  }

  const toggleCategory = (c: NotificationCategory) => {
    setCategory((prev) => (prev === c ? '' : c))
    setPage(1)
  }

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }: { row: { original: Notification } }) => (
        <code className="text-[10px] font-mono">{row.original.id.slice(0, 13)}…</code>
      ),
    },
    {
      accessorKey: 'protocol_name',
      header: 'Protocol',
      cell: ({ row }: { row: { original: Notification } }) => (
        <span className="font-bold">{row.original.protocol_name}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: { row: { original: Notification } }) => (
        <Badge variant="developer" className="capitalize">{row.original.category}</Badge>
      ),
    },
    {
      accessorKey: 'wallet_hash',
      header: 'Recipient',
      cell: ({ row }: { row: { original: Notification } }) => (
        <code className="text-[10px] font-mono text-text-muted">{truncateHash(row.original.wallet_hash)}</code>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Notification } }) => (
        <Badge variant={row.original.status as NotificationStatus}>{row.original.status.replace('_', ' ').toUpperCase()}</Badge>
      ),
    },
    {
      accessorKey: 'queued_at',
      header: 'Sent',
      cell: ({ row }: { row: { original: Notification } }) => (
        <span className="text-xs text-text-secondary">{formatRelativeTime(row.original.queued_at)}</span>
      ),
    },
    {
      accessorKey: 'latency_ms',
      header: 'Latency',
      cell: ({ row }: { row: { original: Notification } }) => (
        <span className="text-xs font-mono">{row.original.latency_ms ? `${row.original.latency_ms}ms` : '—'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Audit"
        description="Trace all notifications sent through the platform. Filter by status, category, or protocol."
        actions={
          <Button variant="secondary" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Filter by Protocol ID…"
            className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold border transition-colors',
                category === c
                  ? 'bg-teal text-white border-teal'
                  : 'bg-card border-border text-text-muted hover:border-teal/50',
              )}
            >
              {c.toUpperCase()}
            </button>
          ))}
          <div className="w-px bg-border mx-1" />
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-bold border transition-colors capitalize',
                status === s
                  ? 'bg-teal text-white border-teal'
                  : 'bg-card border-border text-text-muted hover:border-teal/50',
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
          {(status || category) && (
            <button
              onClick={() => { setStatus(''); setCategory(''); setPage(1) }}
              className="px-3 py-1 rounded-full text-xs font-bold border border-border text-text-muted hover:text-red hover:border-red transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns as never[]}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(row: { id: string }) => router.push(`/notifications/${row.id}`)}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {data ? `Showing ${data.data.length} of ${data.total} notifications` : 'Loading…'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!data?.has_more} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
