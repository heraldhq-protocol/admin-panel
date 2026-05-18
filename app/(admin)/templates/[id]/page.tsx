/* eslint-disable import/no-default-export */
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, XCircle, Sparkles, AlertTriangle,
  Code2, FileText, Clock, Tag, Shield, Info,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useTemplate, useApproveTemplate, useRejectTemplate, useAnalyzeTemplate } from '@/hooks/use-templates'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/cn'
import type { TemplateAnalysis } from '@/types/api'

const TIER_LABELS: Record<number, string> = { 0: 'Developer', 1: 'Growth', 2: 'Scale', 3: 'Enterprise' }

function SpamMeter({ score }: { score: number }) {
  const color = score < 30 ? 'bg-green' : score < 60 ? 'bg-gold' : 'bg-red'
  const label = score < 30 ? 'Clean' : score < 60 ? 'Moderate' : 'High Risk'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">Spam Score</span>
        <span className={cn('font-bold', score < 30 ? 'text-green' : score < 60 ? 'text-gold' : 'text-red')}>
          {score}/100 — {label}
        </span>
      </div>
      <div className="h-2 rounded-full bg-card-2 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function AnalysisPanel({ analysis }: { analysis: TemplateAnalysis }) {
  return (
    <div className="space-y-4">
      <SpamMeter score={analysis.spam_score} />

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-text-secondary">Tone:</span>
        <Badge variant="developer" className="capitalize">{analysis.tone}</Badge>
        {analysis.source === 'ai' && (
          <span className="flex items-center gap-1 text-teal text-[10px]">
            <Sparkles size={10} /> AI-powered
          </span>
        )}
      </div>

      <p className="text-sm text-text-secondary italic">{analysis.summary}</p>

      {analysis.flags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-text-primary">Issues Found</p>
          <ul className="space-y-1">
            {analysis.flags.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.suggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-text-primary">Suggestions</p>
          <ul className="space-y-1">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <Info size={12} className="mt-0.5 shrink-0 text-blue" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: template, isLoading } = useTemplate(id)
  const approveTemplate = useApproveTemplate()
  const rejectTemplate = useRejectTemplate()
  const analyzeTemplate = useAnalyzeTemplate()

  const [activeTab, setActiveTab] = React.useState<'preview' | 'html' | 'text'>('preview')
  const [rejectDialog, setRejectDialog] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState('')
  const [analysis, setAnalysis] = React.useState<TemplateAnalysis | null>(null)

  const handleApprove = async () => {
    if (!template) return
    try {
      await approveTemplate.mutateAsync(template.id)
      toast.success(`Template "${template.name}" approved.`)
      router.push('/templates')
    } catch {
      toast.error('Failed to approve template')
    }
  }

  const handleRejectConfirm = async () => {
    if (!template) return
    if (rejectReason.trim().length < 5) { toast.error('Reason must be at least 5 characters'); return }
    try {
      await rejectTemplate.mutateAsync({ id: template.id, reason: rejectReason.trim() })
      toast.success('Template rejected — reset to draft.')
      router.push('/templates')
    } catch {
      toast.error('Failed to reject template')
    }
  }

  const handleAnalyze = async () => {
    if (!template) return
    try {
      const result = await analyzeTemplate.mutateAsync(template.id)
      setAnalysis(result)
      toast.success('Analysis complete')
    } catch {
      toast.error('Analysis failed — try again')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-card-2 rounded animate-pulse" />
        <div className="h-64 bg-card-2 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-text-muted">
        <AlertTriangle size={40} />
        <p>Template not found</p>
        <Button variant="outline" onClick={() => router.push('/templates')}>Back to queue</Button>
      </div>
    )
  }

  const isPending = template.status === 'PENDING_REVIEW'

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        description={
          <span className="flex flex-wrap items-center gap-2 mt-1">
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-mono border capitalize',
              template.status === 'APPROVED' ? 'bg-green/10 text-green border-green/20'
                : template.status === 'PENDING_REVIEW' ? 'bg-gold/10 text-gold border-gold/20'
                : 'bg-card-2 text-text-muted border-border',
            )}>{template.status.replace(/_/g, ' ').toLowerCase()}</span>
            <span className="text-text-muted text-xs">v{template.version}</span>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-text-muted text-xs capitalize">{template.category}</span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => router.push('/templates')}>
              <ArrowLeft size={14} className="mr-1" /> Queue
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzeTemplate.isPending}
            >
              <Sparkles size={14} className="mr-1" />
              {analyzeTemplate.isPending ? 'Analyzing…' : 'AI Analyze'}
            </Button>
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green hover:text-green/80 hover:bg-green/10"
                  disabled={approveTemplate.isPending}
                  onClick={() => void handleApprove()}
                >
                  <CheckCircle size={14} className="mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red hover:text-red/80 hover:bg-red/10"
                  onClick={() => { setRejectReason(''); setRejectDialog(true) }}
                >
                  <XCircle size={14} className="mr-1" /> Reject
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: metadata + analysis */}
        <div className="space-y-4">
          {/* Protocol card */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Protocol</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary">{template.protocol.name}</span>
              <Badge variant="developer">{TIER_LABELS[template.protocol.tier] ?? `Tier ${template.protocol.tier}`}</Badge>
            </div>
            {template.protocol.is_suspended && (
              <Badge variant="suspended">Suspended</Badge>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Metadata</p>
            <dl className="space-y-2 text-sm">
              {[
                { icon: Tag, label: 'Category', value: template.category },
                { icon: Shield, label: 'Footer', value: template.herald_footer },
                { icon: Clock, label: 'Submitted', value: formatDistanceToNow(new Date(template.updated_at), { addSuffix: true }) },
                { icon: Clock, label: 'Created', value: format(new Date(template.created_at), 'MMM d, yyyy') },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon size={13} className="mt-0.5 text-text-muted shrink-0" />
                  <span className="text-text-muted w-20 shrink-0">{label}</span>
                  <span className="text-text-primary capitalize">{value}</span>
                </div>
              ))}
            </dl>
          </div>

          {/* Version history */}
          {template.versions.length > 1 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Version History</p>
              <ul className="space-y-1.5">
                {template.versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between text-xs">
                    <span className={cn('font-mono', v.version === template.version ? 'text-teal font-bold' : 'text-text-muted')}>
                      v{v.version}
                    </span>
                    <span className="text-text-muted">{format(new Date(v.created_at), 'MMM d')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Analysis panel */}
          {analysis && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles size={12} className="text-teal" /> Analysis
              </p>
              <AnalysisPanel analysis={analysis} />
            </div>
          )}
        </div>

        {/* Right: template content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Subject */}
          {template.subject_template && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Subject Line</p>
              <p className="text-sm text-text-primary font-medium">{template.subject_template}</p>
            </div>
          )}

          {/* Preview text */}
          {template.preview_text && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Preview Text</p>
              <p className="text-sm text-text-secondary italic">{template.preview_text}</p>
            </div>
          )}

          {/* Body tabs */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex border-b border-border">
              {([
                { id: 'preview', label: 'Preview', icon: FileText },
                { id: 'html', label: 'HTML Source', icon: Code2 },
                { id: 'text', label: 'Plain Text', icon: FileText },
              ] as const).map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                    activeTab === tabId
                      ? 'border-teal text-teal'
                      : 'border-transparent text-text-muted hover:text-text-secondary',
                  )}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === 'preview' && (
                template.html_source ? (
                  <iframe
                    srcDoc={template.html_source}
                    className="w-full rounded-lg border border-border bg-white"
                    style={{ minHeight: '480px', height: '60vh' }}
                    sandbox="allow-same-origin"
                    title="Template preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 text-text-muted text-sm">
                    No HTML source available for this template.
                  </div>
                )
              )}

              {activeTab === 'html' && (
                template.html_source ? (
                  <pre className="text-[11px] font-mono text-text-secondary bg-card-2 rounded-lg p-3 overflow-auto max-h-[60vh] whitespace-pre-wrap break-all">
                    {template.html_source}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-48 text-text-muted text-sm">No HTML source.</div>
                )
              )}

              {activeTab === 'text' && (
                template.text_source ? (
                  <pre className="text-[12px] font-mono text-text-secondary bg-card-2 rounded-lg p-3 overflow-auto max-h-[60vh] whitespace-pre-wrap">
                    {template.text_source}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-48 text-text-muted text-sm">No plain text version.</div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={rejectDialog} onOpenChange={(o) => !o && setRejectDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-secondary">
            Describe why this template is being rejected. It will be reset to draft status.
          </p>
          <textarea
            className="w-full rounded-md border border-border bg-card-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-teal resize-none"
            placeholder="e.g. Contains phishing-style urgency language..."
            value={rejectReason}
            rows={3}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={rejectTemplate.isPending || rejectReason.trim().length < 5}
              onClick={() => void handleRejectConfirm()}
            >
              Reject Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
