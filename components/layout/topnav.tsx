'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Menu, Loader2, Search } from 'lucide-react'
import { useIsFetching } from '@tanstack/react-query'
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

interface TopnavProps {
  onOpenPalette?: () => void
}

export function Topnav({ onOpenPalette }: TopnavProps) {
  const title = usePageTitle()
  const { setMobileSidebarOpen } = useUiStore()
  const isFetching = useIsFetching()

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
        {isFetching > 0 && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-text-muted" aria-live="polite" aria-label="Refreshing data">
            <Loader2 className="h-3 w-3 animate-spin" />
            Refreshing
          </span>
        )}
      </div>

      {/* Right: search trigger + theme toggle + docs link */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPalette}
          aria-label="Open command palette"
          className="flex items-center gap-2 h-8 px-2 sm:px-3 rounded-lg text-xs text-text-muted hover:bg-card-2 hover:text-text-primary transition-colors border border-transparent hover:border-border"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-border px-1 py-0.5 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>
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