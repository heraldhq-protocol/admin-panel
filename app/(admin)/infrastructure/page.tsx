/* eslint-disable import/no-default-export */
// Required: Next.js App Router pages must use default export
'use client'

import * as React from 'react'
import {
  Copy,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Cpu,
  ShieldCheck,
  Zap,
  FileCode,
  RefreshCcw,
} from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WalletInfo {
  address: string
  solBalance: number
  lamports: number
  funded: boolean
}

// ─── Wallet card ──────────────────────────────────────────────────────────────

interface WalletCardProps {
  label: string
  description: string
  purpose: string[]
  minRecommended: number
  data: WalletInfo | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  icon: React.ReactNode
}

function WalletCard({
  label,
  description,
  purpose,
  minRecommended,
  data,
  loading,
  error,
  onRefresh,
  icon,
}: WalletCardProps) {
  const [copied, setCopied] = React.useState(false)

  function copy() {
    if (!data?.address) return
    navigator.clipboard.writeText(data.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const explorerUrl = data?.address
    ? `https://explorer.solana.com/address/${data.address}`
    : null

  const isCriticallyLow =
    data && data.funded && data.solBalance < minRecommended * 0.1

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-syne font-bold text-text-primary">{label}</h3>
            <p className="text-xs text-text-muted mt-0.5">{description}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Balance */}
      {loading ? (
        <Skeleton className="h-14 rounded-lg" />
      ) : error ? (
        <div className="rounded-lg bg-red/10 border border-red/20 px-4 py-3 text-sm text-red">
          {error}
        </div>
      ) : data ? (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-bg px-4 py-3 border border-border">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
              SOL Balance
            </div>
            <div className="text-2xl font-black font-syne text-text-primary">
              {data.solBalance.toFixed(4)}{' '}
              <span className="text-sm font-normal text-text-muted">SOL</span>
            </div>
            <div className="text-[10px] text-text-muted mt-0.5">
              {data.lamports.toLocaleString()} lamports
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {data.funded ? (
              <Badge variant="active">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Funded
              </Badge>
            ) : (
              <Badge variant="failed">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unfunded
              </Badge>
            )}
            {isCriticallyLow && (
              <Badge variant="inactive" className="text-[9px]">
                Low — top up soon
              </Badge>
            )}
          </div>
        </div>
      ) : null}

      {/* Address */}
      {data?.address && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">
            Wallet Address
          </span>
          <div className="flex items-center gap-2 rounded-lg bg-bg border border-border px-3 py-2">
            <code className="flex-1 text-xs text-text-primary font-mono truncate">
              {data.address}
            </code>
            <button
              onClick={copy}
              className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
              title="Copy address"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-teal" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-text-muted hover:text-teal transition-colors"
                title="View on Solana Explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Purpose */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          Used for
        </span>
        <ul className="space-y-1">
          {purpose.map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-text-secondary">
              <Zap className="h-3 w-3 text-teal shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Funding guidance */}
      {data && !data.funded && (
        <div className="rounded-lg bg-gold/10 border border-gold/20 px-4 py-3 text-xs text-text-secondary">
          <span className="font-bold text-text-primary">Action required — </span>
          Send at least{' '}
          <span className="font-mono font-bold text-text-primary">
            {minRecommended} SOL
          </span>{' '}
          to the address above to enable on-chain operations. Each transaction costs ~0.00025 SOL in fees plus ~0.002 SOL rent for new PDAs.
        </div>
      )}

      <div className="text-[10px] text-text-muted border-t border-border pt-3">
        Minimum recommended balance:{' '}
        <span className="font-mono font-bold text-text-primary">
          {minRecommended} SOL
        </span>
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InfrastructurePage() {
  const [authority, setAuthority] = React.useState<WalletInfo | null>(null)
  const [authorityLoading, setAuthorityLoading] = React.useState(true)
  const [authorityError, setAuthorityError] = React.useState<string | null>(null)

  async function loadAuthority() {
    setAuthorityLoading(true)
    setAuthorityError(null)
    try {
      const data = await apiClient.getAuthority()
      setAuthority(data)
    } catch {
      setAuthorityError('Failed to load authority info. Check that the admin-api is reachable and KMS is configured.')
    } finally {
      setAuthorityLoading(false)
    }
  }

  React.useEffect(() => {
    loadAuthority()
  }, [])

  const allFunded = authority?.funded ?? false

  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader
        title="Solana Infrastructure"
        description="Wallets that fund on-chain Herald operations. Each requires SOL to pay transaction fees."
        actions={
          <div className="flex items-center gap-2">
            {!authorityLoading && (
              <Badge variant={allFunded ? 'active' : 'failed'}>
                {allFunded ? 'All wallets funded' : 'Action required'}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadAuthority}
              disabled={authorityLoading}
            >
              <RefreshCcw className={`h-3.5 w-3.5 mr-2 ${authorityLoading ? 'animate-spin' : ''}`} />
              Refresh all
            </Button>
          </div>
        }
      />

      {/* Overview banner when any wallet is unfunded */}
      {!authorityLoading && authority && !authority.funded && (
        <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4">
          <AlertTriangle className="h-5 w-5 text-gold shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-text-primary">
              On-chain operations are degraded
            </p>
            <p className="text-xs text-text-secondary mt-1">
              One or more authority wallets have zero SOL. Protocol registration, tier changes,
              subscription renewals, and ZK receipt anchoring will fail until these wallets are funded.
            </p>
          </div>
        </div>
      )}

      {/* Wallet cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WalletCard
          label="KMS Authority (admin-api)"
          description="AWS KMS Ed25519 key — private key never leaves KMS"
          purpose={[
            'Protocol registration on-chain',
            'Tier upgrades and downgrades',
            'Subscription renewals',
            'Protocol suspension / reactivation',
            'ZK delivery receipt anchoring (admin path)',
          ]}
          minRecommended={0.5}
          data={authority}
          loading={authorityLoading}
          error={authorityError}
          onRefresh={loadAuthority}
          icon={<Cpu className="h-5 w-5 text-teal" />}
        />

        <Card padding="lg" className="flex flex-col gap-5 border-dashed opacity-60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-card-2 flex items-center justify-center shrink-0">
              <FileCode className="h-5 w-5 text-text-muted" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-text-primary">
                Gateway Authority (notification-gateway)
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Signs ZK receipts in the hot delivery path
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-bg border border-border px-4 py-3 text-xs text-text-muted">
            Balance monitoring for the gateway authority wallet is not yet wired up.
            Currently using <code className="font-mono">HERALD_AUTHORITY_SECRET</code> (plaintext).
            Migrate to KMS and add a <code className="font-mono">GET /enclave/authority</code> endpoint
            in the gateway to enable monitoring here.
          </div>
          <ul className="space-y-1">
            {['ZK delivery receipt anchoring (gateway path)'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-text-muted">
                <Zap className="h-3 w-3 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Context */}
      <Card padding="lg" className="bg-bg-elevated">
        <h3 className="font-syne font-bold text-sm text-text-primary mb-3">
          How Herald uses on-chain transactions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-text-secondary">
          <div>
            <p className="font-bold text-text-primary mb-1">Protocol registration</p>
            <p>
              When a protocol clicks &ldquo;Sync On-chain&rdquo;, the admin-api submits a Solana
              transaction via the KMS authority to create the <code className="font-mono">protocol_account</code> PDA.
              This is required before ZK receipts can be anchored.
            </p>
          </div>
          <div>
            <p className="font-bold text-text-primary mb-1">ZK receipt anchoring</p>
            <p>
              After each delivered notification, the gateway batches up to 20 receipts every 5 minutes
              and writes them to the Light Protocol compressed Merkle tree. Each batch is one Solana
              transaction signed by the authority wallet.
            </p>
          </div>
          <div>
            <p className="font-bold text-text-primary mb-1">Fee estimation</p>
            <p>
              Each transaction costs ~0.00025 SOL in network fees. PDA creation adds ~0.002 SOL
              rent (refundable). 0.5 SOL covers ~2,000 transactions before a top-up is needed.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
