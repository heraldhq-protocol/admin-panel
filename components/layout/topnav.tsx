'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Menu } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { useUiStore } from '@/lib/stores/ui-store'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/protocols': 'Protocols',
  '/notifications': 'Notifications',
  '/receipts': 'Receipt Queue',
  '/email-health': 'Email Health',
  '/design-partners': 'Design Partners',
  '/incidents': 'Incidents',
  '/team': 'Team',
}

function usePageTitle(): string {
  const pathname = usePathname()
  const match = Object.keys(PAGE_TITLES)
    .filter((k) => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]
  return match ? (PAGE_TITLES[match] ?? 'Admin') : 'Admin'
}

export function Topnav() {
  const title = usePageTitle()
  const { setMobileSidebarOpen } = useUiStore()

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 bg-bg-elevated border-b border-border shrink-0">
      {/* Left: hamburger (mobile only) + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-card-2 hover:text-text-primary transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="font-syne font-semibold text-sm text-text-primary tracking-tight">
          {title}
        </h2>
      </div>

      {/* Right: theme toggle + docs link (docs hidden on xs) */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="https://docs.heraldhq.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-medium text-text-muted hover:bg-card-2 hover:text-text-primary transition-colors"
        >
          Docs
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </header>
  )
}