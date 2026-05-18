/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Users, Plus, Search, ExternalLink, ShieldCheck, Gem,
  DollarSign, AlertTriangle, Download, X, Mail,
  LayoutList, Columns,
} from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDesignPartners } from '@/hooks/use-design-partners'
import { useAddDesignPartner } from '@/hooks/use-add-design-partner'
import { useProtocols } from '@/hooks/use-protocols'
import { cn } from '@/lib/cn'
import type { DesignPartner, PipelineStage, CampaignSource, BillingType } from '@/types/api'

const TIER_OPTIONS: { value: 1 | 2 | 3; label: string; desc: string }[] = [
  { value: 1, label: 'Growth',     desc: '50K sends / period' },
  { value: 2, label: 'Scale',      desc: '250K sends / period' },
  { value: 3, label: 'Enterprise', desc: '1M sends / period' },
]

// ─── Pipeline config ──────────────────────────────────────────────────────────

const STAGES: { value: PipelineStage | 'all'; label: string; color: string; dot: string }[] = [
  { value: 'all',         label: 'All',         color: 'bg-card-2 text-text-muted border-border',                dot: 'bg-text-muted' },
  { value: 'prospect',    label: 'Prospect',    color: 'bg-slate-800/60 text-slate-300 border-slate-700',        dot: 'bg-slate-400' },
  { value: 'outreach',    label: 'Outreach',    color: 'bg-blue-900/40 text-blue-300 border-blue-800',           dot: 'bg-blue-400' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-amber-900/30 text-amber-300 border-amber-800',        dot: 'bg-amber-400' },
  { value: 'signed',      label: 'Signed',      color: 'bg-purple-900/30 text-purple-300 border-purple-800',     dot: 'bg-purple-400' },
  { value: 'active',      label: 'Active',      color: 'bg-teal/10 text-teal border-teal/30',                    dot: 'bg-teal' },
  { value: 'on_hold',     label: 'On Hold',     color: 'bg-orange-900/30 text-orange-300 border-orange-700',     dot: 'bg-orange-400' },
  { value: 'churned',     label: 'Churned',     color: 'bg-red/10 text-red border-red/30',                       dot: 'bg-red' },
]

const CAMPAIGN_SOURCES: { value: CampaignSource; label: string }[] = [
  { value: 'conference',    label: 'Conference' },
  { value: 'twitter',       label: 'Twitter / X' },
  { value: 'referral',      label: 'Referral' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'inbound',       label: 'Inbound' },
  { value: 'colosseum',     label: 'Colosseum' },
  { value: 'other',         label: 'Other' },
]

function stageCfg(stage: PipelineStage | string) {
  return STAGES.find((s) => s.value === stage) ?? STAGES[0]
}

function daysUntilRenewal(retainerEnd: string | null): number | null {
  if (!retainerEnd) return null
  return Math.ceil((new Date(retainerEnd).getTime() - Date.now()) / 86_400_000)
}

function exportCsv(partners: DesignPartner[]) {
  const headers = [
    'Protocol', 'Stage', 'Contact Name', 'Contact Email', 'Campaign Source',
    'Billing Type', 'Granted Tier', 'Grant Expires',
    'Retainer (USD/mo)', 'Start Date', 'End Date', 'Equity Warrant',
    'Feedback Sessions', 'Sends This Period', 'Status', 'Added',
  ]
  const rows = partners.map((p) => [
    p.protocol_name,
    p.pipeline_stage,
    p.contact_name ?? '',
    p.contact_email ?? '',
    p.campaign_source ?? '',
    p.billing_type,
    p.granted_tier != null ? TIER_OPTIONS.find((t) => t.value === p.granted_tier)?.label ?? p.granted_tier : '',
    p.tier_grant_expires_at?.slice(0, 10) ?? '',
    (p.retainer_amount_cents / 100).toFixed(2),
    p.retainer_start.slice(0, 10),
    p.retainer_end?.slice(0, 10) ?? '',
    p.equity_warrant_issued ? 'Yes' : 'No',
    p.feedback_sessions,
    p.sends_this_period,
    p.status,
    p.created_at.slice(0, 10),
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `herald-design-partners-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DesignPartnersPage() {
  const router = useRouter()
  const { data, isLoading } = useDesignPartners()
  const addPartner = useAddDesignPartner()
  const { data: protocolsData } = useProtocols({ per_page: 200 } as never)
  const allProtocols = protocolsData?.data ?? []

  const PAGE_SIZE = 10
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [stageFilter, setStageFilter] = React.useState<PipelineStage | 'all'>('all')
  const [viewMode, setViewMode] = React.useState<'list' | 'board'>('list')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    protocol_id: '',
    protocol_name: '',
    retainer_amount_usd: '1000',
    retainer_start: new Date().toISOString().slice(0, 10),
    retainer_end: '',
    equity_warrant_issued: false,
    pipeline_stage: 'prospect' as PipelineStage,
    contact_name: '',
    contact_email: '',
    campaign_source: '' as CampaignSource | '',
    notes: '',
    billing_type: 'retainer' as BillingType,
    granted_tier: 1 as 1 | 2 | 3,
    tier_grant_expires_at: '',
  })
  const [protocolSearch, setProtocolSearch] = React.useState('')
  const [protocolDropdownOpen, setProtocolDropdownOpen] = React.useState(false)
  const protocolInputRef = React.useRef<HTMLInputElement>(null)

  const filteredProtocols = React.useMemo(() => {
    const q = protocolSearch.toLowerCase()
    return allProtocols.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8)
  }, [allProtocols, protocolSearch])

  const allPartners: DesignPartner[] = data?.data ?? []

  const filtered = allPartners.filter((p) => {
    const matchesSearch = !search || p.protocol_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.contact_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchesStage = stageFilter === 'all' || p.pipeline_stage === stageFilter
    return matchesSearch && matchesStage
  })

  // Stats
  const activeMrr = allPartners
    .filter((p) => p.pipeline_stage === 'active')
    .reduce((sum, p) => sum + p.retainer_amount_cents, 0)
  const pipelineValue = allPartners
    .filter((p) => ['outreach', 'negotiating', 'signed'].includes(p.pipeline_stage))
    .reduce((sum, p) => sum + p.retainer_amount_cents, 0)
  const renewingSoon = allPartners.filter((p) => {
    const d = daysUntilRenewal(p.retainer_end)
    return d !== null && d >= 0 && d <= 30
  }).length
  const activeCount = allPartners.filter((p) => p.pipeline_stage === 'active').length

  const totalPartners = filtered.length
  const totalPages = Math.ceil(totalPartners / PAGE_SIZE)
  const pagedPartners = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  React.useEffect(() => { setPage(1) }, [search, stageFilter])

  // Stage counts
  const stageCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    allPartners.forEach((p) => { counts[p.pipeline_stage] = (counts[p.pipeline_stage] ?? 0) + 1 })
    return counts
  }, [allPartners])

  function handleAdd() {
    const cents = form.billing_type === 'retainer' ? Math.round(parseFloat(form.retainer_amount_usd) * 100) : 0
    addPartner.mutate(
      {
        protocol_id: form.protocol_id,
        retainer_amount_cents: cents,
        retainer_start: form.retainer_start,
        retainer_end: form.retainer_end || undefined,
        equity_warrant_issued: form.equity_warrant_issued,
        pipeline_stage: form.pipeline_stage,
        contact_name: form.contact_name || undefined,
        contact_email: form.contact_email || undefined,
        campaign_source: (form.campaign_source as CampaignSource) || undefined,
        notes: form.notes || undefined,
        billing_type: form.billing_type,
        granted_tier: form.billing_type === 'tier_grant' ? form.granted_tier : undefined,
        tier_grant_expires_at: form.billing_type === 'tier_grant' && form.tier_grant_expires_at ? form.tier_grant_expires_at : undefined,
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setForm({
            protocol_id: '', protocol_name: '', retainer_amount_usd: '1000',
            retainer_start: new Date().toISOString().slice(0, 10),
            retainer_end: '', equity_warrant_issued: false,
            pipeline_stage: 'prospect', contact_name: '',
            contact_email: '', campaign_source: '', notes: '',
            billing_type: 'retainer', granted_tier: 1, tier_grant_expires_at: '',
          })
          setProtocolSearch('')
        },
      },
    )
  }

  const isFormValid = form.protocol_id.trim().length >= 5

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Design Partners"
          description="Track and manage protocol teams from prospect to active partner."
        />
        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors', viewMode === 'list' ? 'bg-teal/10 text-teal' : 'text-text-muted hover:bg-card-2')}
            >
              <LayoutList size={13} /> List
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors border-l border-border', viewMode === 'board' ? 'bg-teal/10 text-teal' : 'text-text-muted hover:bg-card-2')}
            >
              <Columns size={13} /> Board
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="gap-2 shadow-lg shadow-teal/20" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Partner
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Monthly Revenue" value={`$${(activeMrr / 100).toLocaleString()}`} icon={<DollarSign size={16} />} color="teal" />
        <StatCard label="Active Partners" value={activeCount} icon={<ShieldCheck size={16} />} color="teal" />
        <StatCard label="Pipeline Value" value={`$${(pipelineValue / 100).toLocaleString()}`} icon={<Gem size={16} />} color="gold" />
        <StatCard label="Renewing ≤30 days" value={renewingSoon} icon={<AlertTriangle size={16} />} color={renewingSoon > 0 ? 'red' : undefined} />
      </div>

      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2">
        {STAGES.map((s) => {
          const count = s.value === 'all' ? allPartners.length : (stageCounts[s.value] ?? 0)
          return (
            <button
              key={s.value}
              onClick={() => setStageFilter(s.value as PipelineStage | 'all')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                stageFilter === s.value
                  ? s.color + ' ring-1 ring-current/30'
                  : 'bg-card border-border text-text-muted hover:border-border-2',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
              {s.label}
              {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          )
        })}
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search protocol or contact…"
            className="bg-card border border-border rounded-lg py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal w-56"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Board View ─────────────────────────────────────────────────────── */}
      {viewMode === 'board' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.filter((s) => s.value !== 'all').map((s) => {
              const columnPartners = filtered.filter((p) => p.pipeline_stage === s.value)
              return (
                <div key={s.value} className="w-64 shrink-0 space-y-2">
                  {/* Column header */}
                  <div className={cn('flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-bold', s.color)}>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                      {s.label}
                    </div>
                    <span className="opacity-60">{columnPartners.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="space-y-2">
                    {columnPartners.length === 0 ? (
                      <div className="px-3 py-6 text-center text-[11px] text-text-muted border border-dashed border-border rounded-lg">
                        No partners
                      </div>
                    ) : columnPartners.map((p) => {
                      const days = daysUntilRenewal(p.retainer_end)
                      const nearRenewal = days !== null && days >= 0 && days <= 30

                      return (
                        <div
                          key={p.id}
                          onClick={() => router.push(`/design-partners/${p.id}`)}
                          className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-teal/30 transition-colors space-y-2"
                        >
                          <div>
                            <p className="text-sm font-bold text-text-primary leading-tight">{p.protocol_name}</p>
                            {p.campaign_source && (
                              <p className="text-[10px] text-text-muted mt-0.5">
                                via {CAMPAIGN_SOURCES.find((c) => c.value === p.campaign_source)?.label ?? p.campaign_source}
                              </p>
                            )}
                          </div>
                          {p.contact_name && (
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-full bg-card-2 flex items-center justify-center text-[9px] font-black text-text-muted shrink-0">
                                {p.contact_name.charAt(0).toUpperCase()}
                              </div>
                              <p className="text-xs text-text-secondary truncate">{p.contact_name}</p>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            {p.billing_type === 'tier_grant' ? (
                              <span className="text-[10px] font-bold text-purple-300">
                                {TIER_OPTIONS.find((t) => t.value === p.granted_tier)?.label} grant
                              </span>
                            ) : (
                              <span className={cn('text-xs font-mono font-bold', ['prospect', 'outreach'].includes(p.pipeline_stage) ? 'text-text-muted' : 'text-teal')}>
                                {['prospect', 'outreach'].includes(p.pipeline_stage) ? 'TBD' : `$${(p.retainer_amount_cents / 100).toLocaleString()}`}
                              </span>
                            )}
                            {nearRenewal && (
                              <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                                <AlertTriangle size={9} />
                                {days}d
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── List / Table View ───────────────────────────────────────────────── */}
      {viewMode === 'list' && <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-card-2 border-b border-border">
              <tr>
                <th className="px-5 py-3.5 font-bold">Protocol</th>
                <th className="px-5 py-3.5 font-bold">Stage</th>
                <th className="px-5 py-3.5 font-bold">Contact</th>
                <th className="px-5 py-3.5 font-bold text-right">Retainer / mo</th>
                <th className="px-5 py-3.5 font-bold text-center">Renewal</th>
                <th className="px-5 py-3.5 font-bold text-center">Sessions</th>
                <th className="px-5 py-3.5 font-bold text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : pagedPartners.length === 0
                  ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-16 text-center text-text-muted">
                          {search || stageFilter !== 'all' ? 'No partners match your filters.' : 'No design partners yet. Add your first prospect.'}
                        </td>
                      </tr>
                    )
                  : pagedPartners.map((p) => {
                      const stage = stageCfg(p.pipeline_stage)
                      const days = daysUntilRenewal(p.retainer_end)
                      const renewalWarning = days !== null && days >= 0 && days <= 30

                      return (
                        <tr
                          key={p.id}
                          onClick={() => router.push(`/design-partners/${p.id}`)}
                          className="hover:bg-card-2 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold text-text-primary">{p.protocol_name}</div>
                            {p.campaign_source && (
                              <span className="text-[10px] text-text-muted uppercase tracking-wider">
                                via {CAMPAIGN_SOURCES.find((s) => s.value === p.campaign_source)?.label ?? p.campaign_source}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold border', stage.color)}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', stage.dot)} />
                              {stage.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {p.contact_name ? (
                              <div>
                                <div className="text-sm font-medium text-text-primary">{p.contact_name}</div>
                                {p.contact_email && (
                                  <div className="flex items-center gap-1 text-[11px] text-text-muted">
                                    <Mail size={10} />
                                    {p.contact_email}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-text-muted text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {p.billing_type === 'tier_grant' ? (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-900/30 text-purple-300 border border-purple-700">
                                  {TIER_OPTIONS.find((t) => t.value === p.granted_tier)?.label ?? `Tier ${p.granted_tier}`} grant
                                </span>
                                {p.tier_grant_expires_at && (
                                  <div className="text-[10px] text-text-muted mt-0.5">
                                    exp. {new Date(p.tier_grant_expires_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : p.pipeline_stage === 'prospect' || p.pipeline_stage === 'outreach' ? (
                              <span className="text-text-muted font-normal text-xs">TBD</span>
                            ) : (
                              <span className="font-mono font-bold text-teal">${(p.retainer_amount_cents / 100).toLocaleString()}</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {days === null ? (
                              <span className="text-text-muted text-xs">—</span>
                            ) : renewalWarning ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                                <AlertTriangle size={11} />
                                {days}d
                              </span>
                            ) : days < 0 ? (
                              <span className="text-[11px] text-red font-bold">Expired</span>
                            ) : (
                              <span className="text-xs text-text-muted">{new Date(p.retainer_end!).toLocaleDateString()}</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <Badge variant="developer">{p.feedback_sessions}</Badge>
                          </td>
                          <td className="px-5 py-4 text-right pr-5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => { e.stopPropagation(); router.push(`/design-partners/${p.id}`) }}
                            >
                              <ExternalLink className="h-4 w-4 text-text-muted" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
            </tbody>
          </table>
        </div>

        {/* Pipeline summary footer */}
        {!isLoading && allPartners.length > 0 && (
          <div className="border-t border-border px-5 py-3 flex items-center gap-6 text-xs text-text-muted bg-card-2/50">
            <span>{filtered.length} of {allPartners.length} partners shown</span>
            <span className="text-teal font-mono font-bold">MRR: ${(activeMrr / 100).toLocaleString()}</span>
            <span className="text-amber-400 font-mono">Pipeline: ${(pipelineValue / 100).toLocaleString()}</span>
          </div>
        )}
      </Card>}

      {!isLoading && totalPartners > PAGE_SIZE && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-text-muted">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalPartners)} of {totalPartners} partners
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Add Partner Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-bg-elevated border border-border rounded-xl shadow-lg z-50 p-6 animate-in zoom-in-95 duration-200 focus:outline-none max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-syne font-bold text-text-primary">Add Design Partner</Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card-2">
                <X size={20} />
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              {/* Pipeline Stage */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Pipeline Stage</label>
                <div className="flex flex-wrap gap-2">
                  {STAGES.filter((s) => s.value !== 'all').map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, pipeline_stage: s.value as PipelineStage }))}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all',
                        form.pipeline_stage === s.value ? s.color : 'bg-card border-border text-text-muted',
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />{s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Protocol selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Protocol *</label>
                <div className="relative">
                  {form.protocol_id ? (
                    <div className="flex items-center justify-between w-full bg-card border border-teal rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm font-bold text-text-primary">{form.protocol_name}</span>
                        <span className="ml-2 text-[10px] text-text-muted font-mono">{form.protocol_id.slice(0, 8)}…</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setForm((f) => ({ ...f, protocol_id: '', protocol_name: '' })); setProtocolSearch(''); setTimeout(() => protocolInputRef.current?.focus(), 0) }}
                        className="text-text-muted hover:text-text-primary ml-2"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                      <input
                        ref={protocolInputRef}
                        type="text"
                        placeholder="Search protocols by name…"
                        className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-teal"
                        value={protocolSearch}
                        onChange={(e) => { setProtocolSearch(e.target.value); setProtocolDropdownOpen(true) }}
                        onFocus={() => setProtocolDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setProtocolDropdownOpen(false), 150)}
                      />
                      {protocolDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-bg-elevated border border-border rounded-lg shadow-lg overflow-hidden">
                          {filteredProtocols.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-text-muted">
                              {allProtocols.length === 0 ? 'Loading protocols…' : 'No protocols match'}
                            </div>
                          ) : (
                            filteredProtocols.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-card-2 text-left"
                                onMouseDown={() => {
                                  setForm((f) => ({ ...f, protocol_id: p.id, protocol_name: p.name }))
                                  setProtocolSearch('')
                                  setProtocolDropdownOpen(false)
                                }}
                              >
                                <span className="font-medium text-text-primary">{p.name}</span>
                                <span className="text-[10px] text-text-muted font-mono">{p.id.slice(0, 8)}…</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Contact Name</label>
                  <input type="text" placeholder="Alex Chen" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Contact Email</label>
                  <input type="email" placeholder="alex@protocol.xyz" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} />
                </div>
              </div>

              {/* Campaign Source */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Campaign Source</label>
                <select className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={form.campaign_source} onChange={(e) => setForm((f) => ({ ...f, campaign_source: e.target.value as CampaignSource | '' }))}>
                  <option value="">Select source…</option>
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
                      onClick={() => setForm((f) => ({ ...f, billing_type: bt }))}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all',
                        form.billing_type === bt
                          ? 'bg-teal/10 text-teal border-teal/40'
                          : 'bg-card border-border text-text-muted hover:border-border-2',
                      )}
                    >
                      {bt === 'retainer' ? 'Paid Retainer' : 'Free Tier Grant'}
                    </button>
                  ))}
                </div>

                {form.billing_type === 'retainer' ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Amount (USD/mo)</label>
                      <input type="number" min="0" step="100" placeholder="1000" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={form.retainer_amount_usd} onChange={(e) => setForm((f) => ({ ...f, retainer_amount_usd: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Start Date</label>
                      <input type="date" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={form.retainer_start} onChange={(e) => setForm((f) => ({ ...f, retainer_start: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">End Date</label>
                      <input type="date" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={form.retainer_end} onChange={(e) => setForm((f) => ({ ...f, retainer_end: e.target.value }))} />
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
                            onClick={() => setForm((f) => ({ ...f, granted_tier: t.value }))}
                            className={cn(
                              'py-2 px-3 rounded-lg border text-left transition-all',
                              form.granted_tier === t.value
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
                        <input type="date" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={form.retainer_start} onChange={(e) => setForm((f) => ({ ...f, retainer_start: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Grant Expires</label>
                        <input type="date" className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal" value={form.tier_grant_expires_at} onChange={(e) => setForm((f) => ({ ...f, tier_grant_expires_at: e.target.value }))} />
                      </div>
                    </div>
                    <p className="text-[11px] text-text-muted bg-card-2 rounded-lg px-3 py-2 border border-border">
                      The protocol&apos;s account tier will be set to <strong className="text-purple-300">{TIER_OPTIONS.find((t) => t.value === form.granted_tier)?.label}</strong> immediately. They can upgrade and start paying at any time, which takes precedence over the grant.
                    </p>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-border accent-teal" checked={form.equity_warrant_issued} onChange={(e) => setForm((f) => ({ ...f, equity_warrant_issued: e.target.checked }))} />
                <span className="text-sm text-text-primary">Equity warrant issued</span>
              </label>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Notes</label>
                <textarea className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal min-h-[60px] resize-none" placeholder="Initial context, outreach notes, feature requests…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close>
              <Button disabled={!isFormValid || addPartner.isPending} onClick={handleAdd}>
                {addPartner.isPending ? 'Adding…' : 'Add Partner'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

function StatCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: React.ReactNode; color?: 'teal' | 'gold' | 'red'
}) {
  return (
    <Card padding="lg" className="flex items-center gap-4">
      <div className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
        color === 'teal' ? 'bg-teal/10 text-teal' :
        color === 'gold' ? 'bg-amber-400/10 text-amber-400' :
        color === 'red' ? 'bg-red/10 text-red' :
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
