'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useUiStore } from '@/lib/stores/ui-store'
import { NAV_GROUPS } from '@/lib/nav-config'
import { useOverview } from '@/hooks/use-overview'
import { useReceiptQueue } from '@/hooks/use-receipt-queue'
import { useModerationQueue } from '@/hooks/use-moderation'
import { usePendingTemplates as useTemplates } from '@/hooks/use-templates'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

// ─── Badge counts ────────────────────────────────────────────────────────────

function useSidebarBadges(): Record<string, number> {
  const { data: overview } = useOverview()
  const { data: receipts } = useReceiptQueue()
  const { data: moderation } = useModerationQueue({ page: 1, per_page: 1 })
  const { data: templates } = useTemplates()

  return {
    openIncidents:        overview?.open_incidents ?? 0,
    failedReceipts:       receipts?.data?.length ?? 0,
    pendingModeration:    moderation?.total ?? 0,
    pendingTemplates:     templates?.total ?? 0,
    pendingVerifications: 0, // populated when protocol verification endpoint exposes count
  }
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { data: session } = useSession()
  const badges = useSidebarBadges()

  const displayName = session?.user?.name ?? 'Admin'
  const role = (session?.user as { role?: string } | undefined)?.role ?? 'admin'
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-bg-elevated border-r border-border transition-all duration-300',
        sidebarCollapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      {/* ── Logo ──────────────────────────────────── */}
      <div
        className={cn(
          'h-14 flex items-center px-4',
          sidebarCollapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-teal flex items-center justify-center">
              <span className="text-[10px] font-black text-bg">H</span>
            </div>
            <span className="font-syne font-bold text-sm tracking-tight text-text-primary">
              HERALD
            </span>
            <span className="bg-admin text-[8px] font-black text-white px-1 rounded ml-1">
              ADMIN
            </span>
          </div>
        )}

        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex h-6 w-6 rounded hover:bg-card-2 items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="flex h-6 w-6 rounded hover:bg-card-2 items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <button
          onClick={() => useUiStore.getState().setMobileSidebarOpen(false)}
          className="flex lg:hidden h-6 w-6 rounded hover:bg-card-2 items-center justify-center text-text-muted transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="border-t border-border" />

      {/* ── Navigation ────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {/* Group label — hidden when collapsed */}
            {group.label && !sidebarCollapsed && (
              <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted select-none">
                {group.label}
              </p>
            )}

            {/* Separator between groups when collapsed */}
            {group.label && sidebarCollapsed && gi > 0 && (
              <div className="border-t border-border my-2" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                const badgeCount = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0

                const linkContent = (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center h-9 rounded-lg px-2 transition-all duration-200',
                      isActive
                        ? 'bg-teal/10 text-teal border-l-2 border-teal'
                        : 'text-text-muted hover:bg-card-2 hover:text-text-secondary border-l-2 border-transparent',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-teal'
                          : 'text-text-muted group-hover:text-text-secondary',
                      )}
                    />

                    {!sidebarCollapsed && (
                      <>
                        <span className="ml-3 text-sm font-medium font-syne flex-1 truncate">
                          {item.name}
                        </span>
                        {badgeCount > 0 && (
                          <span className="ml-auto h-4 min-w-4 px-1 rounded-full bg-admin text-white text-[10px] font-bold flex items-center justify-center">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </>
                    )}

                    {/* Collapsed badge dot */}
                    {sidebarCollapsed && badgeCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-admin" />
                    )}
                  </Link>
                )

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.name} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="relative">{linkContent}</div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.name}
                        {badgeCount > 0 && (
                          <span className="ml-2 text-admin font-bold">{badgeCount}</span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return <div key={item.name}>{linkContent}</div>
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User footer ───────────────────────────── */}
      <div className="border-t border-border p-3">
        {sidebarCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="mx-auto h-8 w-8 rounded-lg flex hover:bg-card-2 items-center justify-center text-text-muted transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-teal text-white flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
              <Badge variant="growth" className="mt-0.5 px-1 py-0 text-[9px] uppercase tracking-wider">
                {role.replace('_', ' ')}
              </Badge>
            </div>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-admin-bg hover:text-admin transition-colors"
                >
                  <LogOut size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Sign out</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  )
}
