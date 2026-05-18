'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ALL_NAV_ITEMS } from '@/lib/nav-config'
import { useProtocols } from '@/hooks/use-protocols'
import { useIncidents } from '@/hooks/use-incidents'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ResultItem {
  id: string
  label: string
  sublabel?: string
  group: string
  action: () => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: protocols } = useProtocols({ per_page: 50, page: 1 })
  const { data: incidents } = useIncidents({ status: 'open' })

  const navigate = (href: string) => {
    router.push(href)
    onOpenChange(false)
    setQuery('')
  }

  const allItems = useMemo<ResultItem[]>(() => {
    const navResults: ResultItem[] = ALL_NAV_ITEMS.map((item) => ({
      id:       `nav-${item.href}`,
      label:    item.name,
      group:    'Navigation',
      action:   () => navigate(item.href),
    }))

    const protocolResults: ResultItem[] = (protocols?.data ?? []).map((p) => ({
      id:       `protocol-${p.id}`,
      label:    p.name,
      sublabel: p.protocol_pubkey.slice(0, 12) + '…',
      group:    'Protocols',
      action:   () => navigate(`/protocols/${p.id}`),
    }))

    const incidentResults: ResultItem[] = (incidents?.data ?? []).map((i) => ({
      id:       `incident-${i.id}`,
      label:    i.title,
      sublabel: `${i.severity} · ${i.status}`,
      group:    'Open Incidents',
      action:   () => navigate(`/incidents/${i.id}`),
    }))

    return [...navResults, ...protocolResults, ...incidentResults]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocols?.data, incidents?.data])

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 12)
    const q = query.toLowerCase()
    return allItems
      .filter((item) =>
        item.label.toLowerCase().includes(q) ||
        item.sublabel?.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q),
      )
      .slice(0, 12)
  }, [allItems, query])

  // Group filtered results
  const grouped = useMemo(() => {
    const map = new Map<string, ResultItem[]>()
    for (const item of filtered) {
      const arr = map.get(item.group) ?? []
      arr.push(item)
      map.set(item.group, arr)
    }
    return map
  }, [filtered])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[activeIndex]?.action()
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  let flatIndex = 0

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-150" />
        <Dialog.Content
          className="fixed left-1/2 top-[20vh] -translate-x-1/2 w-[90vw] max-w-lg bg-bg-elevated border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200 focus:outline-none"
          aria-label="Command palette"
          onKeyDown={handleKeyDown}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">Search navigation, protocols, and incidents. Use arrow keys to navigate, Enter to select.</Dialog.Description>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, protocols, incidents…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
            <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] text-text-muted font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-muted">
                No results for &ldquo;{query}&rdquo;
              </p>
            ) : (
              Array.from(grouped.entries()).map(([group, items]) => (
                <div key={group}>
                  <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {group}
                  </p>
                  {items.map((item) => {
                    const isActive = flatIndex === activeIndex
                    const currentIndex = flatIndex++
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isActive
                            ? 'bg-teal/10 text-teal'
                            : 'text-text-secondary hover:bg-card-2',
                        )}
                        onMouseEnter={() => setActiveIndex(currentIndex)}
                        onClick={item.action}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          {item.sublabel && (
                            <p className="text-xs text-text-muted font-mono truncate">
                              {item.sublabel}
                            </p>
                          )}
                        </div>
                        {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-text-muted">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> select</span>
            <span><kbd className="font-mono">ESC</kbd> close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
