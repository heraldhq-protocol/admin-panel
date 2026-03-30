'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':       'Overview',
  '/protocols':       'Protocols',
  '/notifications':   'Notifications',
  '/receipts':        'Receipt Queue',
  '/email-health':    'Email Health',
  '/design-partners': 'Design Partners',
  '/incidents':       'Incidents',
  '/team':            'Team',
}

function usePageTitle(): string {
  const pathname = usePathname()
  // Match longest prefix
  const match = Object.keys(PAGE_TITLES)
    .filter((k) => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]
  return match ? (PAGE_TITLES[match] ?? 'Admin') : 'Admin'
}

export function Topnav() {
  const title = usePageTitle()

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-bg-elevated border-b border-border shrink-0">
      {/* Left: page title */}
      <h2 className="font-syne font-semibold text-sm text-text-primary tracking-tight">
        {title}
      </h2>

      {/* Right: theme toggle + docs link */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="https://docs.heraldhq.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-medium text-text-muted hover:bg-card-2 hover:text-text-primary transition-colors"
        >
          Docs
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </header>
  )
}