/* eslint-disable import/no-default-export */
'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSupportTickets } from '@/hooks/use-support'
import { formatDistanceToNow } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import type { SupportTicket, SupportFilters, SupportTicketStatus, SupportTicketCategory, SupportTicketPriority } from '@/types/api'

const STATUS_BADGE: Record<SupportTicketStatus, string> = {
  open: 'developer',
  in_progress: 'growth',
  waiting_on_protocol: 'scale',
  resolved: 'delivered',
  closed: 'opted_out',
}

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_on_protocol: 'Waiting on Protocol',
  resolved: 'Resolved',
  closed: 'Closed',
}

const PRIORITY_BADGE: Record<SupportTicketPriority, string> = {
  urgent: 'p0',
  high: 'p1',
  normal: 'p2',
  low: 'p3',
}

const CATEGORY_LABEL: Record<SupportTicketCategory, string> = {
  api_issue: 'API Issue',
  delivery_failure: 'Delivery Failure',
  billing: 'Billing',
  verification: 'Verification',
  account: 'Account',
  abuse_report: 'Abuse Report',
  feature_request: 'Feature Request',
  other: 'Other',
}

const STATUS_FILTERS: { label: string; value: SupportTicketStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Waiting', value: 'waiting_on_protocol' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
]

const columns: ColumnDef<SupportTicket>[] = [
  {
    header: 'Ticket',
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <p className="text-sm font-medium truncate max-w-xs">{row.original.subject}</p>
        <p className="text-xs text-text-secondary font-mono">{row.original.id.slice(0, 8)}…</p>
      </div>
    ),
  },
  {
    header: 'Protocol',
    cell: ({ row }) => (
      <span className="text-sm text-text-secondary">{row.original.protocolName ?? '—'}</span>
    ),
  },
  {
    header: 'Category',
    cell: ({ row }) => (
      <span className="text-xs text-text-secondary">
        {CATEGORY_LABEL[row.original.category] ?? row.original.category}
      </span>
    ),
  },
  {
    header: 'Priority',
    cell: ({ row }) => (
      <Badge variant={PRIORITY_BADGE[row.original.priority] as any}>{row.original.priority}</Badge>
    ),
  },
  {
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={STATUS_BADGE[row.original.status] as any}>
        {STATUS_LABEL[row.original.status]}
      </Badge>
    ),
  },
  {
    header: 'Linear',
    cell: ({ row }) =>
      row.original.linearIssueUrl ? (
        <a
          href={row.original.linearIssueUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Linear
        </a>
      ) : (
        <span className="text-xs text-text-tertiary">—</span>
      ),
  },
  {
    header: 'Opened',
    cell: ({ row }) => (
      <span className="text-xs text-text-secondary">
        {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
      </span>
    ),
  },
]

export default function SupportTicketsPage() {
  const router = useRouter()
  const [page, setPage] = React.useState(1)
  const [statusFilter, setStatusFilter] = React.useState<SupportTicketStatus | ''>('')

  const filters: SupportFilters = statusFilter ? { status: statusFilter } : {}
  const { data, isLoading } = useSupportTickets({ ...filters, page, per_page: 20 })

  const tickets = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  function setStatus(status: SupportTicketStatus | '') {
    setStatusFilter(status)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description={`${total} ticket${total !== 1 ? 's' : ''} total`}
      />

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/support/${row.id}`)}
        emptyMessage="No support tickets found."
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
