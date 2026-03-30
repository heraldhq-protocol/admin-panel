'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Download } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QUERY_KEYS } from '@/lib/query-keys'
import { truncateHash, formatRelativeTime } from '@/lib/format'

export default function NotificationsPage() {
  const [page, setPage] = React.useState(1)

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.notifications({ page }),
    queryFn: () => 
      fetch(`/api/admin/notifications?page=${page}`).then(res => res.json()),
  })

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }: any) => <code className="text-[10px]">{row.original.id}</code>
    },
    {
      accessorKey: 'protocol_name',
      header: 'Protocol',
      cell: ({ row }: any) => <span className="font-bold">{row.original.protocol_name}</span>
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: any) => (
        <Badge variant="developer" className="capitalize">{row.original.category}</Badge>
      )
    },
    {
      accessorKey: 'wallet_hash',
      header: 'Recipient Hash',
      cell: ({ row }: any) => (
        <code className="text-[10px]">{truncateHash(row.original.wallet_hash)}</code>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={row.original.status}>
          {row.original.status.toUpperCase()}
        </Badge>
      )
    },
    {
      accessorKey: 'queued_at',
      header: 'Sent',
      cell: ({ row }: any) => (
        <span className="text-xs text-text-secondary">
          {formatRelativeTime(row.original.queued_at)}
        </span>
      )
    },
    {
      accessorKey: 'latency_ms',
      header: 'Latency',
      cell: ({ row }: any) => (
        <span className="text-xs font-mono">
          {row.original.latency_ms ? `${row.original.latency_ms}ms` : '-'}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Notification Audit" 
        description="View and trace all notifications sent through the platform infrastructure."
        actions={
          <Button variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by ID or hash..."
            className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9">Defi</Button>
          <Button variant="outline" size="sm" className="h-9">Governance</Button>
          <Button variant="secondary" size="sm" className="h-9">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      <DataTable 
        columns={columns as any} 
        data={data?.data || []} 
        isLoading={isLoading}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          Showing {data?.data.length || 0} items
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={!data?.has_more}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}