/* eslint-disable import/no-default-export */
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, ExternalLink, ShieldAlert, ShieldCheck, Copy, CheckCircle2 } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import { formatTier, truncateAddress } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Protocol } from '@/types/api'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [submitted, setSubmitted] = React.useState('')
  const [results, setResults] = React.useState<Protocol[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return

    setLoading(true)
    setError(null)
    setSubmitted(q)

    try {
      const res = await apiClient.getProtocols({ search: q, per_page: 10 })
      setResults(res.data)
      setTotal(res.total)
    } catch {
      setError('Search failed. Check your connection and try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const isBase58 = submitted.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(submitted)
  const isUlid = submitted.length === 26 && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(submitted)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submitted)

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Protocol Lookup"
        description="Find any protocol by wallet address, name, or ID."
      />

      {/* Search form */}
      <Card padding="lg">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Search Query
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Wallet pubkey, protocol name, or ID…"
                  className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-teal font-mono placeholder:font-sans"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={!query.trim() || loading}>
                {loading ? 'Searching…' : 'Search'}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-text-muted">
            <span className="font-semibold text-text-secondary">Examples:</span>
            {['Jupiter', 'Drift', '7vfCXTU...'].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setQuery(ex); }}
                className="px-2 py-0.5 rounded bg-card-2 border border-border hover:border-teal hover:text-teal transition-colors font-mono"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Results */}
      {submitted && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {loading ? 'Searching…' : `${total} result${total !== 1 ? 's' : ''} for `}
              {!loading && <code className="ml-1 font-mono text-text-secondary bg-card-2 px-1 rounded">{submitted}</code>}
            </span>
            {!loading && (isBase58 || isUlid || isUuid) && (
              <span className="text-[10px] bg-card-2 border border-border rounded px-2 py-0.5">
                Interpreted as: {isBase58 ? 'Wallet pubkey' : isUuid ? 'UUID' : 'ULID'}
              </span>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm">{error}</div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rect" className="h-24" />)}
            </div>
          ) : results.length === 0 && !error ? (
            <Card padding="lg">
              <p className="text-sm text-text-muted text-center py-4">
                No protocol found matching <code className="font-mono">{submitted}</code>
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {results.map((p) => (
                <Card key={p.id} padding="lg" className="hover:border-teal/30 transition-colors cursor-pointer" onClick={() => router.push(`/protocols/${p.id}`)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-text-primary font-syne">{p.name}</h3>
                        <Badge variant={p.is_active ? 'active' : 'suspended'}>
                          {p.is_active ? 'ACTIVE' : 'SUSPENDED'}
                        </Badge>
                        <Badge variant={p.tier === 3 ? 'enterprise' : p.tier === 2 ? 'scale' : p.tier === 1 ? 'growth' : 'developer'}>
                          {formatTier(p.tier).toUpperCase()}
                        </Badge>
                        {p.design_partner && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal/10 text-teal border border-teal/20">
                            Design Partner
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted uppercase font-bold w-20">Pubkey</span>
                          <code className="text-[11px] font-mono text-text-secondary">{p.protocol_pubkey}</code>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(p.protocol_pubkey, `pubkey-${p.id}`) }}
                            className="text-text-muted hover:text-teal transition-colors"
                          >
                            {copied === `pubkey-${p.id}` ? <CheckCircle2 size={12} className="text-teal" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted uppercase font-bold w-20">Protocol ID</span>
                          <code className="text-[11px] font-mono text-text-secondary">{p.id}</code>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(p.id, `id-${p.id}`) }}
                            className="text-text-muted hover:text-teal transition-colors"
                          >
                            {copied === `id-${p.id}` ? <CheckCircle2 size={12} className="text-teal" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted uppercase font-bold w-20">Volume</span>
                          <span className="text-[11px] font-mono text-text-secondary">
                            {p.sends_this_period.toLocaleString()} / {p.sends_limit.toLocaleString()} sends
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.is_active ? (
                        <ShieldCheck size={18} className="text-teal" />
                      ) : (
                        <ShieldAlert size={18} className="text-red" />
                      )}
                      <ExternalLink size={16} className="text-text-muted" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
