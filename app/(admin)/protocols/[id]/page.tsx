/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Settings,
  ShieldAlert,
  ShieldCheck,
  History,
  CreditCard,
  ExternalLink,
  Save,
  X,
  Bell,
  Webhook,
  StickyNote,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { formatRelativeTime, formatTier } from '@/lib/format'
import { WalletAddress } from '@/components/ui/wallet-address'
import { computeHealthScore, healthLabel, healthVariant } from '@/lib/protocol-health'
import { useSuspendProtocol } from '@/hooks/use-suspend-protocol'
import { useUnsuspendProtocol } from '@/hooks/use-unsuspend-protocol'
import { useChangeTier } from '@/hooks/use-change-tier'
import { useUpdateProtocolNotes } from '@/hooks/use-update-protocol-notes'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/cn'
import type { Tier } from '@/types/billing'
import type { AuditLogEntry } from '@/types/api'

type Tab = 'overview' | 'notifications' | 'webhooks' | 'billing' | 'notes' | 'audit_log'

// ─── Action label formatting ──────────────────────────────────────────────────

function formatAction(action: string) {
  return action.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function actionColor(action: string) {
  if (action.includes('suspend')) return 'text-red bg-red/10 border-red/20'
  if (action.includes('unsuspend') || action.includes('reactivate')) return 'text-teal bg-teal/10 border-teal/20'
  if (action.includes('tier')) return 'text-purple-300 bg-purple-900/20 border-purple-700/30'
  if (action.includes('strike')) return 'text-orange-300 bg-orange-900/20 border-orange-700/30'
  if (action.includes('verify')) return 'text-blue-300 bg-blue-900/20 border-blue-700/30'
  if (action.includes('note')) return 'text-text-muted bg-card-2 border-border'
  return 'text-text-secondary bg-card-2 border-border'
}

export default function ProtocolDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: protocol, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.protocol(id),
    queryFn: () => apiClient.getProtocol(id),
    enabled: !!id,
  })

  const suspend = useSuspendProtocol(id)
  const unsuspend = useUnsuspendProtocol(id)
  const changeTier = useChangeTier(id)
  const updateNotes = useUpdateProtocolNotes(id)

  const [activeTab, setActiveTab] = React.useState<Tab>('overview')
  const [suspendOpen, setSuspendOpen] = React.useState(false)
  const [suspendReason, setSuspendReason] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const debouncedNotes = useDebounce(notes, 1000)

  const [auditPage, setAuditPage] = React.useState(1)
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: [...QUERY_KEYS.protocol(id), 'audit', auditPage],
    queryFn: () => apiClient.getProtocolAuditLog(id, { page: auditPage, per_page: 20 }),
    enabled: activeTab === 'audit_log' && !!id,
    staleTime: 60_000,
  })

  React.useEffect(() => {
    if (protocol?.admin_notes != null) setNotes(protocol.admin_notes)
  }, [protocol?.admin_notes])

  React.useEffect(() => {
    if (protocol && debouncedNotes !== (protocol.admin_notes ?? '')) {
      updateNotes.mutate(debouncedNotes)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes])

  const handleSuspendConfirm = () => {
    suspend.mutate(suspendReason, {
      onSuccess: () => {
        setSuspendOpen(false)
        setSuspendReason('')
      },
    })
  }

  if (isLoading) return <div className="p-8"><Skeleton variant="rect" className="h-64" /></div>
  if (isError || !protocol) {
    return (
      <div className="p-8 text-center">
        <p className="text-red mb-4">Protocol not found or failed to load.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const usagePercent = Math.min((protocol.sends_this_period / protocol.sends_limit) * 100, 100)
  const isOverQuota = protocol.sends_this_period > protocol.sends_limit

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Registry
      </Button>

      <PageHeader
        title={protocol.name}
        description={<WalletAddress address={protocol.protocol_pubkey} truncate={false} className="text-text-muted" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={protocol.is_active ? 'active' : 'suspended'}>
              {protocol.is_active ? 'ACTIVE' : 'SUSPENDED'}
            </Badge>
            <Badge variant={protocol.tier === 3 ? 'enterprise' : protocol.tier === 2 ? 'scale' : 'growth'}>
              {formatTier(protocol.tier).toUpperCase()}
            </Badge>
            <Badge variant={healthVariant(computeHealthScore(protocol))}>
              {healthLabel(computeHealthScore(protocol))}
            </Badge>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {([
          { id: 'overview',       label: 'Overview',       icon: CreditCard },
          { id: 'notifications',  label: 'Notifications',  icon: Bell },
          { id: 'webhooks',       label: 'Webhooks',       icon: Webhook },
          { id: 'billing',        label: 'Billing',        icon: Settings },
          { id: 'notes',          label: 'Notes',          icon: StickyNote },
          { id: 'audit_log',      label: 'Audit Log',      icon: History },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === t.id
                ? 'border-teal text-teal'
                : 'border-transparent text-text-muted hover:text-text-secondary',
            )}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Audit Log Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'audit_log' && (
        <Card padding="none">
          {auditLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} variant="rect" className="h-10" />
              ))}
            </div>
          ) : !auditData?.data?.length ? (
            <div className="py-16 text-center text-text-muted text-sm">No audit log entries yet.</div>
          ) : (
            <>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase bg-card-2 border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Action</th>
                    <th className="px-5 py-3.5 font-bold">Resource</th>
                    <th className="px-5 py-3.5 font-bold">Actor</th>
                    <th className="px-5 py-3.5 font-bold text-right">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditData.data.map((entry: AuditLogEntry) => (
                    <tr key={entry.id} className="hover:bg-card-2/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border', actionColor(entry.action))}>
                          {formatAction(entry.action)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-text-muted font-mono">
                        {entry.resource_type ?? '—'}
                        {entry.resource_id && (
                          <span className="ml-1 opacity-50">{entry.resource_id.slice(0, 8)}…</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-text-secondary">
                        {entry.actor_role ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-text-muted text-right">
                        {formatRelativeTime(entry.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-border px-5 py-3 flex items-center justify-between text-xs text-text-muted">
                <span>{auditData.total} total entries</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={auditPage === 1} onClick={() => setAuditPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={!auditData.has_more} onClick={() => setAuditPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ── Notifications Tab ────────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <Card padding="lg" className="space-y-4">
          <h3 className="font-syne text-lg font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal" />
            Recent Notifications
          </h3>
          <p className="text-sm text-text-muted">
            Notification history for <strong>{protocol.name}</strong> is available in the{' '}
            <button
              className="text-teal hover:underline"
              onClick={() => router.push(`/notifications?protocol_id=${protocol.id}`)}
            >
              Notifications queue
            </button>{' '}
            filtered by this protocol.
          </p>
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-teal hover:underline"
            onClick={() => router.push(`/notifications?protocol_id=${protocol.id}`)}
          >
            View all notifications
            <ExternalLink size={14} />
          </button>
        </Card>
      )}

      {/* ── Webhooks Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'webhooks' && (
        <Card padding="lg" className="space-y-4">
          <h3 className="font-syne text-lg font-bold flex items-center gap-2">
            <Webhook className="h-5 w-5 text-teal" />
            Webhook Delivery Log
          </h3>
          <div className="rounded-lg border border-border bg-card-2 p-8 text-center">
            <p className="text-sm text-text-muted">
              Webhook delivery logs will appear here once the webhook log endpoint is wired.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Backend endpoint: <code className="font-mono">GET /v1/admin/protocols/:id/webhook-logs</code>
            </p>
          </div>
        </Card>
      )}

      {/* ── Billing Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="lg" className="space-y-6">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal" />
              Subscription & Usage
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-bold uppercase">Current Tier</p>
                <p className="text-xl font-bold">{formatTier(protocol.tier)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-bold uppercase">Period Reset</p>
                <p className="text-base font-bold">{new Date(protocol.period_reset_at).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-bold uppercase">Sends Used</p>
                <p className={`text-xl font-bold ${protocol.sends_this_period > protocol.sends_limit ? 'text-red' : ''}`}>
                  {protocol.sends_this_period.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-bold uppercase">Monthly Limit</p>
                <p className="text-xl font-bold">{protocol.sends_limit.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Usage</span>
                <span>{Math.min(Math.round((protocol.sends_this_period / protocol.sends_limit) * 100), 100)}%</span>
              </div>
              <div className="w-full h-2 bg-card-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${protocol.sends_this_period > protocol.sends_limit ? 'bg-red' : 'bg-teal'}`}
                  style={{ width: `${Math.min((protocol.sends_this_period / protocol.sends_limit) * 100, 100)}%` }}
                />
              </div>
              {protocol.sends_this_period > protocol.sends_limit && (
                <p className="text-xs text-red font-medium">Over quota — overage billing active</p>
              )}
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <h3 className="font-syne text-base font-bold">Stripe</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Customer ID</p>
                <p className="flex items-center gap-1 font-mono text-xs mt-0.5">
                  {protocol.stripe_customer_id ?? 'N/A'}
                  {protocol.stripe_customer_id && <ExternalLink size={12} className="text-text-muted" />}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Registered</p>
                <p>{formatRelativeTime(protocol.created_at)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Notes Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'notes' && (
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-teal" />
              Admin Notes
            </h3>
            {updateNotes.isPending && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Save size={12} className="animate-pulse" /> Saving…
              </span>
            )}
          </div>
          <textarea
            className="w-full h-[200px] bg-bg rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal border border-border resize-none"
            placeholder="Internal notes — never shown to the protocol. Suspension reasons, billing context, escalation history…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="text-[10px] text-text-muted">Saved automatically. Logged with your admin ID.</p>
        </Card>
      )}

      {/* ── Overview Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription & Volume */}
          <Card padding="lg" className="space-y-6">
            <h3 className="font-syne text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal" />
              Subscription & Volume
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-bold uppercase">Current Usage</p>
                <p className={`text-2xl font-bold ${isOverQuota ? 'text-red' : ''}`}>
                  {protocol.sends_this_period.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-bold uppercase">Monthly Limit</p>
                <p className="text-2xl font-bold">{protocol.sends_limit.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-bold uppercase">Period Reset</p>
                <p className="text-base font-bold">{new Date(protocol.period_reset_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="w-full h-2 bg-card-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOverQuota ? 'bg-red' : 'bg-teal'}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {isOverQuota && (
                <p className="text-xs text-red font-medium">Over quota — overage billing applies</p>
              )}
            </div>
          </Card>

          {/* Admin Notes */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-syne text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-teal" />
                Admin Notes
              </h3>
              {updateNotes.isPending && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Save size={12} className="animate-pulse" /> Saving…
                </span>
              )}
            </div>
            <textarea
              className="w-full h-[140px] bg-bg rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal border border-border resize-none"
              placeholder="Internal notes — never shown to the protocol. Suspension reasons, billing context, escalation history…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="text-[10px] text-text-muted">Saved automatically. This action will be logged with your admin ID.</p>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Operations */}
          <Card padding="lg" className="space-y-4">
            <h3 className="font-syne text-base font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-text-muted" />
              Operations
            </h3>

            {/* Tier selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Tier</label>
              <select
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal"
                value={protocol.tier}
                onChange={(e) => changeTier.mutate(Number(e.target.value) as Tier)}
                disabled={changeTier.isPending}
              >
                <option value={0}>Developer (Free)</option>
                <option value={1}>Growth ($99/mo)</option>
                <option value={2}>Scale ($299/mo)</option>
                <option value={3}>Enterprise ($999/mo)</option>
              </select>
              <p className="text-[10px] text-text-muted">This action will be logged with your admin ID.</p>
            </div>

            <div className="pt-2 space-y-2">
              {protocol.is_active ? (
                <Dialog.Root open={suspendOpen} onOpenChange={setSuspendOpen}>
                  <Dialog.Trigger asChild>
                    <Button variant="danger" className="w-full">
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Suspend Protocol
                    </Button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none">
                      <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-lg font-syne font-bold text-red">
                          Suspend {protocol.name}?
                        </Dialog.Title>
                        <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                          <X size={20} />
                        </Dialog.Close>
                      </div>
                      <p className="text-sm text-text-secondary mb-4">
                        This will immediately block all API calls from this protocol. The suspension reason is logged for audit purposes and never shown to the protocol.
                      </p>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                          Suspension Reason <span className="text-red">*</span>
                        </label>
                        <textarea
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red min-h-[80px] resize-none"
                          placeholder="e.g. Abuse of rate limits — 3 warnings issued. Suspended pending appeal."
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                        />
                        <p className="text-[10px] text-text-muted">Min 10 characters.</p>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <Dialog.Close asChild>
                          <Button variant="ghost">Cancel</Button>
                        </Dialog.Close>
                        <Button
                          variant="danger"
                          disabled={suspendReason.trim().length < 10 || suspend.isPending}
                          onClick={handleSuspendConfirm}
                        >
                          Confirm Suspension
                        </Button>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => unsuspend.mutate()}
                  disabled={unsuspend.isPending}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Reactivate Protocol
                </Button>
              )}
            </div>
          </Card>

          {/* Metadata */}
          <Card padding="lg" className="space-y-4">
            <h3 className="font-syne text-base font-bold">Metadata</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Protocol ID</p>
                <code className="text-[11px] font-mono select-all break-all">{protocol.id}</code>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Stripe Customer</p>
                <p className="flex items-center gap-1">
                  {protocol.stripe_customer_id ?? 'N/A'}
                  {protocol.stripe_customer_id && <ExternalLink size={12} className="text-text-muted" />}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Contact Hash (SHA-256)</p>
                <code className="text-[11px] font-mono break-all">{protocol.contact_email_hash != null ? protocol.contact_email_hash.slice(0, 16) + '…' : 'N/A'}</code>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Registered</p>
                <p>{formatRelativeTime(protocol.created_at)}</p>
              </div>
              {!protocol.is_active && protocol.suspension_reason && (
                <div>
                  <p className="text-[10px] text-red uppercase font-bold tracking-wider">Suspension Reason</p>
                  <p className="text-xs text-text-secondary">{protocol.suspension_reason}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>}
    </div>
  )
}
