/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import {
  ArrowLeft, Handshake, Save, ExternalLink, Pencil, X,
  Mail, User, AlertTriangle, CheckCircle2, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { useDebounce } from '@/hooks/use-debounce'
import { useUpdateDesignPartnerNotes } from '@/hooks/use-update-design-partner-notes'
import { useUpdateDesignPartner } from '@/hooks/use-update-design-partner'
import { cn } from '@/lib/cn'
import type { PipelineStage, CampaignSource, PartnerStatus, BillingType } from '@/types/api'

const TIER_OPTIONS: { value: 1 | 2 | 3; label: string; desc: string }[] = [
  { value: 1, label: 'Growth',     desc: '50K sends / period' },
  { value: 2, label: 'Scale',      desc: '250K sends / period' },
  { value: 3, label: 'Enterprise', desc: '1M sends / period' },
]

// ─── Pipeline config (mirrors list page) ─────────────────────────────────────

const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string; dot: string; description: string }[] = [
  { value: 'prospect',    label: 'Prospect',    color: 'text-slate-400',   dot: 'bg-slate-500',  description: 'Identified, not yet contacted' },
  { value: 'outreach',    label: 'Outreach',    color: 'text-blue-400',    dot: 'bg-blue-500',   description: 'Initial contact made' },
  { value: 'negotiating', label: 'Negotiating', color: 'text-amber-400',   dot: 'bg-amber-500',  description: 'In active discussion' },
  { value: 'signed',      label: 'Signed',      color: 'text-purple-400',  dot: 'bg-purple-500', description: 'Agreement signed' },
  { value: 'active',      label: 'Active',      color: 'text-teal',        dot: 'bg-teal',       description: 'Live design partner' },
  { value: 'on_hold',     label: 'On Hold',     color: 'text-orange-400',  dot: 'bg-orange-500', description: 'Paused or delayed' },
  { value: 'churned',     label: 'Churned',     color: 'text-red',         dot: 'bg-red',        description: 'Ended relationship' },
]

const FLOW_STAGES = PIPELINE_STAGES.filter((s) => !['on_hold', 'churned'].includes(s.value))
const OFF_TRACK_STAGES = PIPELINE_STAGES.filter((s) => ['on_hold', 'churned'].includes(s.value))

const CAMPAIGN_SOURCES: { value: CampaignSource; label: string }[] = [
  { value: 'conference',    label: 'Conference' },
  { value: 'twitter',       label: 'Twitter / X' },
  { value: 'referral',      label: 'Referral' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'inbound',       label: 'Inbound' },
  { value: 'colosseum',     label: 'Colosseum' },
  { value: 'other',         label: 'Other' },
]

const STATUS_OPTIONS: PartnerStatus[] = ['active', 'inactive', 'pending']

function daysUntilRenewal(retainerEnd: string | null): number | null {
  if (!retainerEnd) return null
  return Math.ceil((new Date(retainerEnd).getTime() - Date.now()) / 86_400_000)
}

function stageCfg(stage: PipelineStage | string) {
  return PIPELINE_STAGES.find((s) => s.value === stage) ?? PIPELINE_STAGES[0]
}

// ─── Stage stepper ────────────────────────────────────────────────────────────

function StageStepper({ current }: { current: PipelineStage }) {
  const flowIdx = FLOW_STAGES.findIndex((s) => s.value === current)
  const isOffTrack = ['on_hold', 'churned'].includes(current)
  const cfg = stageCfg(current)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {FLOW_STAGES.map((s, i) => {
          const isPast = !isOffTrack && i < flowIdx
          const isCurrent = !isOffTrack && s.value === current
          const isFuture = isOffTrack || i > flowIdx

          return (
            <React.Fragment key={s.value}>
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                  isPast ? 'bg-teal border-teal text-white' :
                  isCurrent ? 'bg-teal/10 border-teal text-teal scale-110' :
                  'bg-card border-border text-text-muted',
                )}>
                  {isPast ? <CheckCircle2 size={14} /> : <span className="text-[10px] font-black">{i + 1}</span>}
                </div>
                <span className={cn(
                  'text-[10px] font-bold whitespace-nowrap',
                  isCurrent ? cfg.color : isPast ? 'text-teal' : 'text-text-muted',
                )}>
                  {s.label}
                </span>
              </div>
              {i < FLOW_STAGES.length - 1 && (
                <div className={cn('flex-1 h-px mt-[-14px]', i < flowIdx && !isOffTrack ? 'bg-teal' : 'bg-border')} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {isOffTrack && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium',
          current === 'churned'
            ? 'bg-red/10 border-red/20 text-red'
            : 'bg-orange-900/20 border-orange-700/30 text-orange-300',
        )}>
          <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
          {cfg.label} — {cfg.description}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DesignPartnerDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: partner, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.designPartner(id),
    queryFn: () => apiClient.getDesignPartner(id),
    enabled: !!id,
  })

  const updateNotes = useUpdateDesignPartnerNotes(id)
  const updatePartner = useUpdateDesignPartner(id)

  const [notes, setNotes] = React.useState('')
  const debouncedNotes = useDebounce(notes, 1000)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editForm, setEditForm] = React.useState({
    retainer_amount_usd: '',
    retainer_start: '',
    retainer_end: '',
    equity_warrant_issued: false,
    feedback_sessions: 0,
    status: 'active' as PartnerStatus,
    pipeline_stage: 'active' as PipelineStage,
    contact_name: '',
    contact_email: '',
    campaign_source: '' as CampaignSource | '',
    billing_type: 'retainer' as BillingType,
    granted_tier: 1 as 1 | 2 | 3,
    tier_grant_expires_at: '',
  })

  React.useEffect(() => {
    if (partner?.notes != null) setNotes(partner.notes)
  }, [partner?.notes])

  React.useEffect(() => {
    if (partner && debouncedNotes !== (partner.notes ?? '')) {
      updateNotes.mutate(debouncedNotes)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes])

  function openEdit() {
    if (!partner) return
    setEditForm({
      retainer_amount_usd: (partner.retainer_amount_cents / 100).toFixed(2),
      retainer_start: partner.retainer_start.slice(0, 10),
      retainer_end: partner.retainer_end ? partner.retainer_end.slice(0, 10) : '',
      equity_warrant_issued: partner.equity_warrant_issued,
      feedback_sessions: partner.feedback_sessions,
      status: partner.status,
      pipeline_stage: partner.pipeline_stage,
      contact_name: partner.contact_name ?? '',
      contact_email: partner.contact_email ?? '',
      campaign_source: partner.campaign_source ?? '',
      billing_type: partner.billing_type ?? 'retainer',
      granted_tier: (partner.granted_tier as 1 | 2 | 3) ?? 1,
      tier_grant_expires_at: partner.tier_grant_expires_at ? partner.tier_grant_expires_at.slice(0, 10) : '',
    })
    setEditOpen(true)
  }

  function handleSaveEdit() {
    const cents = editForm.billing_type === 'retainer'
      ? Math.round(parseFloat(editForm.retainer_amount_usd) * 100)
      : 0
    updatePartner.mutate(
      {
        retainer_amount_cents: isNaN(cents) ? undefined : cents,
        retainer_start: editForm.retainer_start || undefined,
        retainer_end: editForm.retainer_end || null,
        equity_warrant_issued: editForm.equity_warrant_issued,
        feedback_sessions: editForm.feedback_sessions,
        status: editForm.status,
        pipeline_stage: editForm.pipeline_stage,
        contact_name: editForm.contact_name || null,
        contact_email: editForm.contact_email || null,
        campaign_source: (editForm.campaign_source as CampaignSource) || null,
        billing_type: editForm.billing_type,
        granted_tier: editForm.billing_type === 'tier_grant' ? editForm.granted_tier : null,
        tier_grant_expires_at: editForm.billing_type === 'tier_grant' && editForm.tier_grant_expires_at ? editForm.tier_grant_expires_at : null,
      },
      { onSuccess: () => setEditOpen(false) },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton variant="rect" className="h-12 w-48" />
        <Skeleton variant="rect" className="h-32" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton variant="rect" className="h-64" />
          <Skeleton variant="rect" className="h-64" />
        </div>
      </div>
    )
  }

  if (isError || !partner) {
    return (
      <div className="p-8 text-center">
        <p className="text-red mb-4">Partner not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const days = daysUntilRenewal(partner.retainer_end)
  const renewalWarning = days !== null && days >= 0 && days <= 30
  const expired = days !== null && days < 0
  const currentStage = stageCfg(partner.pipeline_stage)
  const sourceLabel = CAMPAIGN_SOURCES.find((s) => s.value === partner.campaign_source)?.label

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Design Partners
      </Button>

      {/* Header */}
      <PageHeader
        title={partner.protocol_name}
        description={
          <span className="flex items-center gap-2 text-sm text-text-muted">
            Design Partner
            {sourceLabel && (
              <>
                <ChevronRight size={14} />
                <span>via {sourceLabel}</span>
              </>
            )}
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border', currentStage.color.includes('teal') ? 'bg-teal/10 border-teal/30 text-teal' : 'bg-card border-border')}>
              <span className={cn('h-2 w-2 rounded-full', currentStage.dot)} />
              {currentStage.label}
            </span>
            <Button variant="secondary" size="sm" onClick={openEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        }
      />

      {/* Stage stepper */}
      <Card padding="lg">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Pipeline Progress</h3>
        <StageStepper current={partner.pipeline_stage} />
      </Card>

      {/* Renewal warning */}
      {(renewalWarning || expired) && (
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border',
          expired
            ? 'bg-red/10 border-red/20 text-red'
            : 'bg-amber-900/20 border-amber-700/30 text-amber-300',
        )}>
          <AlertTriangle size={18} className="shrink-0" />
          <div>
            <p className="text-sm font-bold">
              {expired ? 'Retainer expired' : `Retainer renewing in ${days} day${days === 1 ? '' : 's'}`}
            </p>
            <p className="text-xs opacity-75">
              {expired
                ? `Ended ${new Date(partner.retainer_end!).toLocaleDateString()} — update the record or discuss renewal.`
                : `Retainer end: ${new Date(partner.retainer_end!).toLocaleDateString()}. Discuss renewal now.`}
            </p>
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact */}
        <Card padding="lg" className="space-y-4">
          <h3 className="font-syne text-base font-bold flex items-center gap-2">
            <User className="h-4 w-4 text-teal" />
            Point of Contact
          </h3>
          {partner.contact_name || partner.contact_email ? (
            <div className="space-y-3">
              {partner.contact_name && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-teal/10 text-teal flex items-center justify-center text-sm font-black shrink-0">
                    {partner.contact_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{partner.contact_name}</p>
                    {partner.contact_email && (
                      <a href={`mailto:${partner.contact_email}`} className="flex items-center gap-1 text-xs text-teal hover:underline">
                        <Mail size={11} />
                        {partner.contact_email}
                      </a>
                    )}
                  </div>
                </div>
              )}
              {!partner.contact_name && partner.contact_email && (
                <a href={`mailto:${partner.contact_email}`} className="flex items-center gap-2 text-sm text-teal hover:underline">
                  <Mail size={14} />
                  {partner.contact_email}
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted italic">No contact added yet. Edit to add one.</p>
          )}
        </Card>

        {/* Agreement terms */}
        <Card padding="lg" className="space-y-4 text-sm">
          <h3 className="font-syne text-base font-bold flex items-center gap-2">
            <Handshake className="h-4 w-4 text-teal" />
            Agreement Terms
          </h3>
          <div className="space-y-2.5">
            {(['prospect', 'outreach'].includes(partner.pipeline_stage)) ? (
              <p className="text-xs text-text-muted italic">Terms will be confirmed at the Negotiating stage.</p>
            ) : partner.billing_type === 'tier_grant' ? (
              <>
                <Row label="Billing Type">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-900/30 text-purple-300 border border-purple-700">
                    Free Tier Grant
                  </span>
                </Row>
                <Row label="Granted Tier">
                  <span className="font-bold text-purple-300">
                    {TIER_OPTIONS.find((t) => t.value === partner.granted_tier)?.label ?? `Tier ${partner.granted_tier}`}
                  </span>
                </Row>
                <Row label="Grant Start">{new Date(partner.retainer_start).toLocaleDateString()}</Row>
                {partner.tier_grant_expires_at && (
                  <Row label="Grant Expires">
                    <span className={(() => {
                      const d = Math.ceil((new Date(partner.tier_grant_expires_at!).getTime() - Date.now()) / 86_400_000)
                      return d < 0 ? 'text-red font-semibold' : d <= 30 ? 'text-amber-400 font-semibold' : undefined
                    })()}>
                      {new Date(partner.tier_grant_expires_at).toLocaleDateString()}
                    </span>
                  </Row>
                )}
              </>
            ) : (
              <>
                <Row label="Billing Type"><span className="text-text-muted text-xs">Paid Retainer</span></Row>
                <Row label="Monthly Retainer">
                  <span className="font-black font-mono text-teal">
                    ${(partner.retainer_amount_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </Row>
                <Row label="Start Date">{new Date(partner.retainer_start).toLocaleDateString()}</Row>
                {partner.retainer_end && (
                  <Row label="End Date">
                    <span className={renewalWarning || expired ? 'text-amber-400 font-semibold' : undefined}>
                      {new Date(partner.retainer_end).toLocaleDateString()}
                      {renewalWarning && <span className="ml-2 text-amber-400 text-[10px]">({days}d)</span>}
                      {expired && <span className="ml-2 text-red text-[10px]">Expired</span>}
                    </span>
                  </Row>
                )}
              </>
            )}
            <Row label="Equity Warrant">
              <span className={partner.equity_warrant_issued ? 'text-teal font-medium' : 'text-text-muted'}>
                {partner.equity_warrant_issued ? 'Issued' : 'Pending'}
              </span>
            </Row>
            <Row label="Feedback Sessions"><span className="font-medium">{partner.feedback_sessions} completed</span></Row>
            <Row label="Sends This Period"><span className="font-mono">{partner.sends_this_period.toLocaleString()}</span></Row>
            <Row label="Protocol">
              <Link href={`/protocols/${partner.protocol_id}`} className="text-teal flex items-center gap-1 hover:underline">
                View Protocol <ExternalLink size={11} />
              </Link>
            </Row>
          </div>
        </Card>
      </div>

      {/* Internal Notes */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-syne text-base font-bold">Internal Notes</h3>
          {updateNotes.isPending && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Save size={12} className="animate-pulse" /> Saving…
            </span>
          )}
        </div>
        <textarea
          className="w-full h-[180px] bg-bg rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal border border-border resize-none"
          placeholder="Outreach history, feature requests, integration status, strategic context… Saved automatically."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p className="text-[10px] text-text-muted">Never shown to the protocol team.</p>
      </Card>

      {/* Edit Dialog */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-syne font-bold">Edit Partner</Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                <X size={20} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              {/* Pipeline Stage */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Pipeline Stage</label>
                <div className="flex flex-wrap gap-2">
                  {PIPELINE_STAGES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, pipeline_stage: s.value }))}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all',
                        editForm.pipeline_stage === s.value
                          ? s.value === 'active' ? 'bg-teal/10 border-teal/30 text-teal' :
                            s.value === 'churned' ? 'bg-red/10 border-red/20 text-red' :
                            s.value === 'prospect' ? 'bg-slate-800 border-slate-600 text-slate-300' :
                            s.value === 'outreach' ? 'bg-blue-900/50 border-blue-700 text-blue-300' :
                            s.value === 'negotiating' ? 'bg-amber-900/40 border-amber-700 text-amber-300' :
                            s.value === 'signed' ? 'bg-purple-900/40 border-purple-700 text-purple-300' :
                            'bg-orange-900/30 border-orange-700 text-orange-300'
                          : 'bg-card border-border text-text-muted',
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />{s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Contact Name</label>
                  <input type="text" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={editForm.contact_name} onChange={(e) => setEditForm((f) => ({ ...f, contact_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Contact Email</label>
                  <input type="email" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={editForm.contact_email} onChange={(e) => setEditForm((f) => ({ ...f, contact_email: e.target.value }))} />
                </div>
              </div>

              {/* Campaign Source */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Campaign Source</label>
                <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={editForm.campaign_source} onChange={(e) => setEditForm((f) => ({ ...f, campaign_source: e.target.value as CampaignSource | '' }))}>
                  <option value="">—</option>
                  {CAMPAIGN_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Billing Arrangement */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Billing Arrangement</label>
                <div className="flex gap-2">
                  {(['retainer', 'tier_grant'] as BillingType[]).map((bt) => (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, billing_type: bt }))}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all',
                        editForm.billing_type === bt
                          ? 'bg-teal/10 text-teal border-teal/40'
                          : 'bg-card border-border text-text-muted hover:border-border-2',
                      )}
                    >
                      {bt === 'retainer' ? 'Paid Retainer' : 'Free Tier Grant'}
                    </button>
                  ))}
                </div>

                {editForm.billing_type === 'retainer' ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Monthly Retainer (USD)</label>
                      <input type="number" min="0" step="100" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={editForm.retainer_amount_usd} onChange={(e) => setEditForm((f) => ({ ...f, retainer_amount_usd: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Start Date</label>
                        <input type="date" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={editForm.retainer_start} onChange={(e) => setEditForm((f) => ({ ...f, retainer_start: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">End Date</label>
                        <input type="date" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={editForm.retainer_end} onChange={(e) => setEditForm((f) => ({ ...f, retainer_end: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Tier to Grant</label>
                      <div className="grid grid-cols-3 gap-2">
                        {TIER_OPTIONS.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setEditForm((f) => ({ ...f, granted_tier: t.value }))}
                            className={cn(
                              'py-2 px-3 rounded-lg border text-left transition-all',
                              editForm.granted_tier === t.value
                                ? 'bg-purple-900/30 border-purple-600 text-purple-300'
                                : 'bg-card border-border text-text-muted hover:border-border-2',
                            )}
                          >
                            <div className="text-xs font-bold">{t.label}</div>
                            <div className="text-[10px] opacity-60">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Grant Start</label>
                        <input type="date" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={editForm.retainer_start} onChange={(e) => setEditForm((f) => ({ ...f, retainer_start: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Grant Expires</label>
                        <input type="date" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={editForm.tier_grant_expires_at} onChange={(e) => setEditForm((f) => ({ ...f, tier_grant_expires_at: e.target.value }))} />
                      </div>
                    </div>
                    <p className="text-[11px] text-text-muted bg-card-2 rounded-lg px-3 py-2 border border-border">
                      The protocol&apos;s tier will be updated to <strong className="text-purple-300">{TIER_OPTIONS.find((t) => t.value === editForm.granted_tier)?.label}</strong>. They can upgrade and pay themselves at any time.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Feedback Sessions</label>
                <input type="number" min="0" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={editForm.feedback_sessions} onChange={(e) => setEditForm((f) => ({ ...f, feedback_sessions: Number(e.target.value) }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Status</label>
                  <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as PartnerStatus }))}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-border accent-teal" checked={editForm.equity_warrant_issued} onChange={(e) => setEditForm((f) => ({ ...f, equity_warrant_issued: e.target.checked }))} />
                    <span className="text-sm text-text-primary">Equity warrant</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close>
              <Button disabled={updatePartner.isPending} onClick={handleSaveEdit}>
                {updatePartner.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-text-muted text-xs">{label}</span>
      <span className="text-text-primary">{children}</span>
    </div>
  )
}
