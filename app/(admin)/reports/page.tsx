/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flag, AlertTriangle, Shield, ExternalLink, Search } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAbuseReports } from '@/hooks/use-abuse-reports'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  phishing: 'Phishing',
  impersonation: 'Impersonation',
  unwanted: 'Unwanted',
  other: 'Other',
}

export default function ReportsPage() {
  const router = useRouter()
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useAbuseReports({
    page,
    per_page: 20,
    ...(debouncedSearch.length >= 5 ? { protocol_id: debouncedSearch } : {}),
  })

  const reports = data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abuse Reports"
        description="User-reported notification abuse, aggregated by protocol. 3+ unique reporters auto-flags a protocol for moderation."
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Reported Protocols"
          value={data?.total ?? 0}
          icon={<Flag size={16} />}
        />
        <StatCard
          label="With Open Moderation"
          value={reports.filter((r) => r.open_moderation_item).length}
          icon={<Shield size={16} />}
          color="red"
        />
        <StatCard
          label="Total Reports (page)"
          value={reports.reduce((sum, r) => sum + r.total_reports, 0)}
          icon={<AlertTriangle size={16} />}
          color="yellow"
        />
      </div>

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

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-card-2 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Protocol</th>
                <th className="px-6 py-4 font-bold text-center">Reports</th>
                <th className="px-6 py-4 font-bold text-center">Unique Reporters</th>
                <th className="px-6 py-4 font-bold text-center">Top Reason</th>
                <th className="px-6 py-4 font-bold text-center">Last Reported</th>
                <th className="px-6 py-4 font-bold text-center">Moderation</th>
                <th className="px-6 py-4 font-bold text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-6 py-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : reports.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-text-muted">
                        {search ? 'No matching protocols.' : 'No abuse reports yet.'}
                      </td>
                    </tr>
                  )
                : reports.map((report) => (
                    <tr
                      key={report.protocol_id}
                      className="hover:bg-card-2 transition-colors cursor-pointer"
                      onClick={() => router.push(`/protocols/${report.protocol_id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-text-primary">{report.protocol_name}</span>
                        <p className="text-[11px] font-mono text-text-muted mt-0.5 truncate max-w-[200px]">
                          {report.protocol_id}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          'font-black font-mono text-base',
                          report.total_reports >= 10 ? 'text-red' :
                          report.total_reports >= 5 ? 'text-amber-400' : 'text-text-primary',
                        )}>
                          {report.total_reports}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={cn(
                            'font-semibold',
                            report.unique_reporters >= 3 ? 'text-red' : 'text-text-secondary',
                          )}>
                            {report.unique_reporters}
                          </span>
                          {report.unique_reporters >= 3 && (
                            <AlertTriangle size={12} className="text-red" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="developer" className="capitalize">
                          {REASON_LABELS[report.most_common_reason] ?? report.most_common_reason}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-text-muted">
                        {report.last_reported_at
                          ? formatRelativeTime(report.last_reported_at)
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {report.open_moderation_item ? (
                          <Link
                            href={`/moderation/${report.moderation_queue_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red/10 border border-red/20 text-red text-[11px] font-bold hover:bg-red/20 transition-colors"
                          >
                            <Shield size={10} />
                            Open
                          </Link>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right pr-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); router.push(`/protocols/${report.protocol_id}`) }}
                        >
                          <ExternalLink className="h-4 w-4 text-text-muted" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {data ? `${data.total} protocol${data.total !== 1 ? 's' : ''} with reports` : 'Loading…'}
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

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color?: 'red' | 'yellow'
}) {
  return (
    <Card padding="lg" className="flex items-center gap-4">
      <div className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
        color === 'red' ? 'bg-red/10 text-red' :
        color === 'yellow' ? 'bg-amber-400/10 text-amber-400' :
        'bg-card-2 text-text-muted',
      )}>
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</div>
        <div className="text-xl font-black text-text-primary font-syne mt-0.5">{value}</div>
      </div>
    </Card>
  )
}
