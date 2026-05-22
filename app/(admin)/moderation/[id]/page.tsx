/* eslint-disable import/no-default-export */
'use client'
import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, XCircle, AlertTriangle,
  Clock, User, FileText, Bot,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  useModerationQueueItem,
  useApproveModeration,
  useStrikeProtocol,
  useDismissModeration,
  useProtocolAuditLog,
} from '@/hooks/use-moderation'
import { useAnalytics } from '@/hooks/use-analytics'

const TYPE_LABEL: Record<string, string> = {
  protocol_registration: 'Registration Screening',
  content_scan: 'Content Scan',
  health_degradation: 'Health Degradation',
  user_report: 'User Report',
}

export default function ModerationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { capture } = useAnalytics()
  const [strikeReason, setStrikeReason] = React.useState('')
  const [forceSuspend, setForceSuspend] = React.useState(false)
  const [strikeOpen, setStrikeOpen] = React.useState(false)
  const [auditPage, setAuditPage] = React.useState(1)

  const { data: item, isLoading } = useModerationQueueItem(id)
  const { data: audit } = useProtocolAuditLog(item?.protocol_id ?? '', auditPage)

  const approve = useApproveModeration()
  const strike = useStrikeProtocol()
  const dismiss = useDismissModeration()

  const isResolved = !!item?.resolved_at

  async function handleApprove() {
    try {
      await approve.mutateAsync(id)
      toast.success('Item approved — flag cleared.')
      capture('moderation_approved', {
        item_id: id,
        type: item?.type ?? 'unknown',
        severity: item?.severity ?? 'unknown',
      })
    } catch {
      toast.error('Failed to approve item.')
    }
  }

  async function handleStrike() {
    if (strikeReason.trim().length < 10) {
      toast.error('Strike reason must be at least 10 characters.')
      return
    }
    try {
      const result = await strike.mutateAsync({ id, reason: strikeReason.trim(), suspend: forceSuspend })
      toast.success(
        result.suspended
          ? `Strike issued — protocol suspended (${result.strike_count} total strikes).`
          : `Strike ${result.strike_count} issued.`,
      )
      capture('moderation_strike_issued', {
        item_id: id,
        protocol_id: item?.protocol_id ?? '',
        strike_count: result.strike_count,
        force_suspend: forceSuspend,
      })
      setStrikeOpen(false)
      setStrikeReason('')
    } catch {
      toast.error('Failed to issue strike.')
    }
  }

  async function handleDismiss() {
    try {
      await dismiss.mutateAsync(id)
      toast.success('Dismissed as false positive.')
      capture('moderation_dismissed', {
        item_id: id,
        type: item?.type ?? 'unknown',
      })
    } catch {
      toast.error('Failed to dismiss item.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-8 w-48 bg-card-2 rounded" />
        <div className="h-40 bg-card-2 rounded" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="text-text-muted text-sm">Moderation item not found.</div>
    )
  }

  const strikeCount = item.protocol_status.strike_count
  const auditTotalPages = Math.ceil((audit?.total ?? 0) / 20)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/moderation')}>
          <ArrowLeft size={14} className="mr-1" /> Queue
        </Button>
      </div>

      <PageHeader
        title={`${TYPE_LABEL[item.type] ?? item.type} — ${item.protocol_name}`}
        description={`Flagged ${formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left column: flag details ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Flag info */}
          <Card padding="md">
            <div className="flex items-center gap-2 text-sm font-bold text-text-primary mb-4">
              <FileText size={14} className="text-text-muted" />
              Flag Details
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Severity</span>
                <Badge variant={
                  item.severity === 'critical' ? 'enterprise'
                  : item.severity === 'high' ? 'scale'
                  : item.severity === 'medium' ? 'growth'
                  : 'developer'
                } className="capitalize">
                  {item.severity}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-text-muted block mb-1">Flag Reason</span>
                <p className="text-sm text-text-primary bg-card-2 rounded p-3 border border-border">
                  {item.flag_reason}
                </p>
              </div>
              {item.rules_triggers.length > 0 && (
                <div>
                  <span className="text-xs text-text-muted block mb-1">Rules Triggered</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.rules_triggers.map((r) => (
                      <code key={r} className="text-[10px] bg-red/10 text-red px-2 py-0.5 rounded border border-red/20">
                        {r}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* AI scan result */}
          {item.ai_scan_result && (
            <Card padding="md">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary mb-4">
                <Bot size={14} className="text-text-muted" />
                AI Classification
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Verdict</span>
                  <Badge variant={
                    item.ai_scan_result.verdict === 'allow' ? 'developer'
                    : item.ai_scan_result.verdict === 'flag' ? 'growth'
                    : 'enterprise'
                  } className="capitalize">
                    {item.ai_scan_result.verdict}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Confidence</span>
                  <span className="text-sm font-mono">
                    {(item.ai_scan_result.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-xs text-text-muted block mb-1">Reason</span>
                  <p className="text-sm text-text-secondary">{item.ai_scan_result.reason}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Audit log */}
          {item.protocol_id && (
            <Card padding="md">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary mb-4">
                <Clock size={14} className="text-text-muted" />
                Protocol Audit Log
              </div>
              {audit?.data.length === 0 && (
                <p className="text-xs text-text-muted">No audit entries.</p>
              )}
              <div className="space-y-2">
                {audit?.data.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-[10px] text-teal">{entry.action}</code>
                        <span className="text-[10px] text-text-muted shrink-0">
                          {format(new Date(entry.timestamp), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      {entry.new_value != null && (
                        <pre className="text-[9px] text-text-muted mt-0.5 truncate">
                          {JSON.stringify(entry.new_value)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {auditTotalPages > 1 && (
                <div className="flex justify-between mt-3">
                  <Button variant="ghost" size="sm" disabled={auditPage === 1} onClick={() => setAuditPage(p => p - 1)}>
                    Prev
                  </Button>
                  <span className="text-xs text-text-muted self-center">
                    {auditPage} / {auditTotalPages}
                  </span>
                  <Button variant="ghost" size="sm" disabled={auditPage >= auditTotalPages} onClick={() => setAuditPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ── Right column: protocol status + actions ── */}
        <div className="flex flex-col gap-4">

          {/* Protocol status */}
          <Card padding="md">
            <div className="flex items-center gap-2 text-sm font-bold text-text-primary mb-4">
              <User size={14} className="text-text-muted" />
              Protocol Status
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Verification" value={
                <Badge variant={
                  item.protocol_status.verification_status === 'VERIFIED' ? 'developer'
                  : item.protocol_status.verification_status === 'FLAGGED' ? 'scale'
                  : 'growth'
                } className="capitalize text-[10px]">
                  {item.protocol_status.verification_status}
                </Badge>
              } />
              <Row label="Suspended" value={
                item.protocol_status.is_suspended
                  ? <span className="text-red font-medium">Yes</span>
                  : <span className="text-green">No</span>
              } />
              <Row label="Strikes" value={
                <span className={strikeCount >= 3 ? 'text-red font-bold' : strikeCount > 0 ? 'text-gold' : 'text-text-secondary'}>
                  {strikeCount} / 4
                </span>
              } />
              {item.protocol_status.last_strike_at && (
                <Row label="Last Strike" value={
                  <span className="text-xs text-text-muted">
                    {formatDistanceToNow(new Date(item.protocol_status.last_strike_at), { addSuffix: true })}
                  </span>
                } />
              )}
            </div>
          </Card>

          {/* Strike history */}
          {(item.protocol_status.strike_reasons?.length ?? 0) > 0 && (
            <Card padding="md">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary mb-4">
                <AlertTriangle size={14} className="text-text-muted" />
                Strike History
              </div>
              <div className="space-y-2">
                {item.protocol_status.strike_reasons?.map((s, i) => (
                  <div key={i} className="text-xs bg-card-2 rounded p-2 border border-border">
                    <div className="flex justify-between mb-0.5">
                      <span className="font-medium text-text-primary capitalize">{s.actionTaken.replace('_', ' ')}</span>
                      <span className="text-text-muted">{format(new Date(s.date), 'MMM d')}</span>
                    </div>
                    <p className="text-text-muted line-clamp-2">{s.reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Resolution status */}
          {isResolved ? (
            <Card padding="md">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {item.resolution === 'approved'
                    ? <CheckCircle size={16} className="text-green" />
                    : item.resolution === 'struck'
                    ? <XCircle size={16} className="text-red" />
                    : <XCircle size={16} className="text-text-muted" />}
                  <span className="text-sm font-medium capitalize">{item.resolution}</span>
                </div>
                <p className="text-xs text-text-muted">
                  Resolved {formatDistanceToNow(new Date(item.resolved_at!), { addSuffix: true })}
                  {item.resolved_by ? ` by ${item.resolved_by}` : ''}
                </p>
              </div>
            </Card>
          ) : (
            <Card padding="md">
              <p className="text-sm font-bold text-text-primary mb-3">Actions</p>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={handleApprove}
                  disabled={approve.isPending}
                >
                  <CheckCircle size={14} className="mr-2" />
                  Approve
                </Button>

                {/* Strike dialog */}
                <Dialog.Root open={strikeOpen} onOpenChange={setStrikeOpen}>
                  <Dialog.Trigger asChild>
                    <Button variant="outline" className="w-full border-gold/30 text-gold hover:bg-gold/10">
                      <AlertTriangle size={14} className="mr-2" />
                      Issue Strike
                    </Button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-bg-elevated border border-border rounded-xl p-6 shadow-xl">
                      <Dialog.Title className="text-base font-bold text-text-primary mb-1">
                        Issue Strike
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-text-muted mb-4">
                        Strike {strikeCount + 1} of 4.
                        {strikeCount >= 3 && ' This strike will auto-suspend the protocol.'}
                      </Dialog.Description>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-text-muted block mb-1.5">
                            Strike reason (min 10 chars)
                          </label>
                          <textarea
                            value={strikeReason}
                            onChange={(e) => setStrikeReason(e.target.value)}
                            rows={3}
                            placeholder="Describe the policy violation..."
                            className="w-full rounded-lg border border-border bg-card-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-teal/50"
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={forceSuspend}
                            onChange={(e) => setForceSuspend(e.target.checked)}
                            className="accent-teal"
                          />
                          <span className="text-sm text-text-secondary">Force suspend immediately</span>
                        </label>

                        <div className="flex gap-2 pt-1">
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => setStrikeOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 border-gold/30 text-gold hover:bg-gold/10"
                            variant="outline"
                            onClick={handleStrike}
                            disabled={strike.isPending || strikeReason.trim().length < 10}
                          >
                            Confirm Strike
                          </Button>
                        </div>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>

                <Button
                  variant="ghost"
                  className="w-full text-text-muted hover:text-text-secondary"
                  onClick={handleDismiss}
                  disabled={dismiss.isPending}
                >
                  <XCircle size={14} className="mr-2" />
                  Dismiss (False Positive)
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-text-muted text-xs">{label}</span>
      <div>{value}</div>
    </div>
  )
}
