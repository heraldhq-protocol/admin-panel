/* eslint-disable import/no-default-export */
'use client'
import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, ChevronLeft, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useSupportTicket,
  useAdminReplyToTicket,
  useUpdateTicketStatus,
  useUpdateTicketPriority,
  useAssignTicket,
} from '@/hooks/use-support'
import { useTeam } from '@/hooks/use-team'
import { formatDistanceToNow, format } from 'date-fns'
import type { SupportTicketStatus, SupportTicketCategory, SupportTicketPriority } from '@/types/api'

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

const PRIORITIES: SupportTicketPriority[] = ['urgent', 'high', 'normal', 'low']

const STATUS_TRANSITIONS: { label: string; value: SupportTicketStatus }[] = [
  { label: 'Mark Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Waiting on Protocol', value: 'waiting_on_protocol' },
  { label: 'Resolve', value: 'resolved' },
  { label: 'Close', value: 'closed' },
]

export default function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: ticket, isLoading } = useSupportTicket(id)
  const { data: team } = useTeam()
  const replyMutation = useAdminReplyToTicket()
  const statusMutation = useUpdateTicketStatus()
  const priorityMutation = useUpdateTicketPriority()
  const assignMutation = useAssignTicket()

  const [replyBody, setReplyBody] = React.useState('')
  const [isInternal, setIsInternal] = React.useState(false)
  const [resolutionNote, setResolutionNote] = React.useState('')
  const [pendingStatus, setPendingStatus] = React.useState<SupportTicketStatus | null>(null)

  async function handleReply() {
    if (!replyBody.trim()) return
    try {
      await replyMutation.mutateAsync({ id, body: replyBody, isInternal })
      toast.success(isInternal ? 'Internal note saved.' : 'Reply sent.')
      setReplyBody('')
    } catch {
      toast.error('Failed to send reply')
    }
  }

  async function handleStatusChange(status: SupportTicketStatus) {
    if (status === 'resolved' || status === 'closed') {
      setPendingStatus(status)
      return
    }
    try {
      await statusMutation.mutateAsync({ id, status })
      toast.success(`Status updated to ${STATUS_LABEL[status]}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleResolve() {
    if (!pendingStatus) return
    try {
      await statusMutation.mutateAsync({
        id,
        status: pendingStatus,
        ...(resolutionNote ? { resolutionNote } : {}),
      })
      toast.success(`Ticket ${pendingStatus === 'resolved' ? 'resolved' : 'closed'}.`)
      setPendingStatus(null)
      setResolutionNote('')
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handlePriorityChange(priority: string) {
    try {
      await priorityMutation.mutateAsync({ id, priority })
      toast.success(`Priority set to ${priority}`)
    } catch {
      toast.error('Failed to update priority')
    }
  }

  async function handleAssign(adminUserId: string) {
    try {
      await assignMutation.mutateAsync({ id, adminUserId })
      toast.success('Ticket assigned.')
    } catch {
      toast.error('Failed to assign ticket')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-secondary">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (!ticket) {
    return <p className="text-text-secondary py-12 text-center">Ticket not found.</p>
  }

  const messages = ticket.messages ?? []
  const enrichment = ticket.enrichmentSnapshot
  const isTerminal = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/support')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title={ticket.subject}
        description={`${CATEGORY_LABEL[ticket.category]} · opened ${formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE[ticket.status] as any}>{STATUS_LABEL[ticket.status]}</Badge>
            <Badge variant={PRIORITY_BADGE[ticket.priority] as any}>{ticket.priority}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: thread + reply */}
        <div className="lg:col-span-2 space-y-4">
          {/* Messages */}
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg border p-4 ${
                  msg.senderType === 'herald_team'
                    ? msg.isInternal
                      ? 'border-amber-500/20 bg-amber-500/5'
                      : 'border-border-accent/30 bg-bg-elevated'
                    : 'border-border bg-bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    {msg.senderType === 'herald_team'
                      ? msg.isInternal ? '🔒 Internal Note' : 'Herald Team'
                      : 'Protocol'}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {format(new Date(msg.createdAt), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{msg.body}</p>
              </div>
            ))}
          </div>

          {/* Reply box — only for non-terminal tickets */}
          {!isTerminal ? (
            <div className="rounded-lg border border-border bg-bg-elevated p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Reply</span>
                <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  Internal note
                </label>
              </div>
              <textarea
                placeholder={isInternal ? 'Internal note (not visible to protocol)…' : 'Reply to protocol…'}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={4}
                maxLength={5000}
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-accent focus:outline-none focus:ring-1 focus:ring-border-accent resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">{replyBody.length}/5000</span>
                <Button
                  size="sm"
                  disabled={replyBody.length < 5 || replyMutation.isPending}
                  onClick={handleReply}
                >
                  {replyMutation.isPending ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Sending…</>
                  ) : isInternal ? 'Save Note' : 'Send Reply'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-bg-elevated p-4">
              <p className="text-sm text-text-secondary">
                This ticket is <span className="font-medium text-text-primary">{STATUS_LABEL[ticket.status]}</span> — no further replies can be added.
              </p>
            </div>
          )}

          {/* Resolution note input */}
          {pendingStatus && (
            <div className="rounded-lg border border-border bg-bg-elevated p-4 space-y-3">
              <p className="text-sm font-medium text-text-primary">
                {pendingStatus === 'resolved' ? 'Resolve' : 'Close'} ticket — add a resolution note (optional)
              </p>
              <textarea
                placeholder="Describe how this was resolved…"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-accent focus:outline-none focus:ring-1 focus:ring-border-accent resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setPendingStatus(null)}>Cancel</Button>
                <Button size="sm" disabled={statusMutation.isPending} onClick={handleResolve}>
                  {statusMutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : pendingStatus === 'resolved' ? 'Resolve' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: metadata + actions */}
        <div className="space-y-4">
          {/* Ticket info */}
          <div className="rounded-lg border border-border bg-bg-elevated p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Details</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Protocol</dt>
                <dd className="text-text-primary font-medium">{ticket.protocolName ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Tier</dt>
                <dd className="text-text-primary">{ticket.protocolTier ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Category</dt>
                <dd className="text-text-primary">{CATEGORY_LABEL[ticket.category]}</dd>
              </div>
              {ticket.resolvedAt && (
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Resolved</dt>
                  <dd className="text-text-primary">{format(new Date(ticket.resolvedAt), 'MMM d, yyyy')}</dd>
                </div>
              )}
              {ticket.resolutionNote && (
                <div className="pt-1">
                  <dt className="text-text-secondary mb-1">Resolution note</dt>
                  <dd className="text-text-primary text-xs leading-relaxed">{ticket.resolutionNote}</dd>
                </div>
              )}
            </dl>
            {ticket.linearIssueUrl && (
              <a
                href={ticket.linearIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                View in Linear
              </a>
            )}
          </div>

          {/* Priority */}
          <div className="rounded-lg border border-border bg-bg-elevated p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-3">Priority</p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  disabled={priorityMutation.isPending}
                  onClick={() => handlePriorityChange(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    ticket.priority === p
                      ? 'bg-bg-card border-border-accent text-text-primary'
                      : 'border-border text-text-secondary hover:border-border-muted hover:text-text-primary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Status actions */}
          {!isTerminal && (
            <div className="rounded-lg border border-border bg-bg-elevated p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-3">Update Status</p>
              {STATUS_TRANSITIONS.filter((t) => t.value !== ticket.status).map((t) => (
                <Button
                  key={t.value}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  disabled={statusMutation.isPending}
                  onClick={() => handleStatusChange(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          )}

          {/* Assign */}
          {team && team.length > 0 && (
            <div className="rounded-lg border border-border bg-bg-elevated p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-3">Assign To</p>
              <select
                className="w-full rounded-md border border-border bg-bg-card px-2.5 py-1.5 text-sm text-text-primary focus:border-border-accent focus:outline-none"
                value={ticket.assignedTo ?? ''}
                onChange={(e) => e.target.value && handleAssign(e.target.value)}
                disabled={assignMutation.isPending}
              >
                <option value="">— Unassigned —</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Enrichment snapshot */}
          {enrichment && (
            <div className="rounded-lg border border-border bg-bg-elevated p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Enrichment</p>
              <dl className="space-y-1.5 text-xs">
                {enrichment.subscriptionStatus != null && (
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Subscription</dt>
                    <dd className="text-text-primary">{String(enrichment.subscriptionStatus)}</dd>
                  </div>
                )}
                {enrichment.totalSendsThisPeriod != null && (
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Sends (period)</dt>
                    <dd className="text-text-primary">{Number(enrichment.totalSendsThisPeriod).toLocaleString()}</dd>
                  </div>
                )}
                {enrichment.webhookFailureCount != null && (
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Webhook failures</dt>
                    <dd className="text-text-primary">{String(enrichment.webhookFailureCount)}</dd>
                  </div>
                )}
                {enrichment.openIncidents != null && (
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Open incidents</dt>
                    <dd className="text-text-primary">{String(enrichment.openIncidents)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
