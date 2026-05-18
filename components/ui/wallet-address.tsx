'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface WalletAddressProps {
  address: string
  truncate?: boolean
  className?: string
}

export function WalletAddress({ address, truncate = true, className }: WalletAddressProps) {
  const [copied, setCopied] = useState(false)

  const display = truncate
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : address

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable (e.g. non-HTTPS)
    }
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-sm', className)}>
      <span title={address} className="select-all">{display}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied!' : 'Copy wallet address'}
        className="text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal rounded"
      >
        {copied
          ? <Check className="h-3.5 w-3.5 text-teal" />
          : <Copy className="h-3.5 w-3.5" />
        }
      </button>
    </span>
  )
}
