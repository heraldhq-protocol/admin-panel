/* eslint-disable import/no-default-export */
'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Filter, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useModerationQueue } from '@/hooks/use-moderation'
import { formatDistanceToNow } from 'date-fns'
import type { ModerationFilters, ModerationSeverity } from '@/types/api'

const SEVERITY_BADGE: Record<ModerationSeverity, string> = {
  low: 'developer',
  medium: 'growth',
  high: 'scale',
  critical: 'enterprise',
}

const SEVERITY_LABEL: Record<ModerationSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const TYPE_LABEL: Record<string, string> = {
  protocol_registration: 'Registration',
  content_scan: 'Content Scan',
  health_degradation: 'Health',
  user_report: 'User Report',
}

export default function ModerationQueuePage() {
  const router = useRouter()
  const [page, setPage] = React.useState(1)
  const [filters, setFilters] = React.useState<ModerationFilters>({ resolved: false })

  const { data, isLoading } = useModerationQueue({ ...filters, page, per_page: 20 })

  const columns = [
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }: any) => (
        <Badge variant={SEVERITY_BADGE[row.original.severity as ModerationSeverity] as any}>
          {SEVERITY_LABEL[row.original.severity as ModerationSeverity]}
        </Badge>
      ),
    },
    {
      accessorKey: 'protocol_name',
      header: 'Protocol',
      cell: ({ row }: any) => (
        <div className="font-semibold text-text-primary">{row.original.protocol_name}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: any) => (
        <span className="text-sm text-text-secondary">
          {TYPE_LABEL[row.original.type] ?? row.original.type}
        </span>
      ),
    },
    {
      accessorKey: 'flag_reason',
      header: 'Flag Reason',
      cell: ({ row }: any) => (
        <span className="text-sm text-text-muted line-clamp-2 max-w-xs">
          {row.original.flag_reason}
        </span>
      ),
    },
    {
      accessorKey: 'protocol_status',
      header: 'Strikes',
      cell: ({ row }: any) => {
        const strikes = row.original.protocol_status?.strike_count ?? 0
        return (
          <div className="flex items-center gap-1">
            {strikes > 0 && <AlertTriangle size={14} className="text-gold" />}
            <span className={strikes >= 3 ? 'text-red font-bold' : 'text-text-secondary'}>
              {strikes}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Flagged',
      cell: ({ row }: any) => (
        <span className="text-xs text-text-muted">
          {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      id: 'resolution',
      header: 'Status',
      cell: ({ row }: any) => {
        if (!row.original.resolved_at) {
          return (
            <div className="flex items-center gap-1 text-amber-500">
              <Clock size={12} />
              <span className="text-xs">Pending</span>
            </div>
          )
        }
        const icons: Record<string, React.ReactNode> = {
          approved: <CheckCircle size={12} className="text-green" />,
          struck: <XCircle size={12} className="text-red" />,
          dismissed: <XCircle size={12} className="text-text-muted" />,
        }
        return (
          <div className="flex items-center gap-1">
            {icons[row.original.resolution] ?? null}
            <span className="text-xs capitalize text-text-secondary">{row.original.resolution}</span>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Moderation Queue"
        description="Review flagged protocols and content. Approve, strike, or dismiss each item."
      />

      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant={!filters.resolved ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setFilters(f => ({ ...f, resolved: false })); setPage(1) }}
        >
          Pending
        </Button>
        <Button
          variant={filters.resolved ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setFilters(f => ({ ...f, resolved: true })); setPage(1) }}
        >
          Resolved
        </Button>

        <div className="h-5 w-px bg-border" />

        {(['low', 'medium', 'high', 'critical'] as ModerationSeverity[]).map((s) => (
          <Button
            key={s}
            variant={filters.severity === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilters(f => ({ ...f, severity: f.severity === s ? undefined : s } as ModerationFilters))
              setPage(1)
            }}
          >
            {SEVERITY_LABEL[s]}
          </Button>
        ))}

        {(filters.severity || filters.type) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ resolved: filters.resolved ?? false })}
          >
            <Filter size={12} className="mr-1" /> Clear filters
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/moderation/${row.id}`)}
        emptyMessage={filters.resolved ? 'No resolved items.' : 'No pending items — queue is clear.'}
      />

      {(data?.total ?? 0) > 20 && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{data?.total ?? 0} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={!data?.has_more} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
