'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Database,
  Bell,
  RefreshCw,
  Activity,
  Users,
  ShieldAlert,
  Handshake,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useUiStore } from '@/lib/stores/ui-store'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Protocols', href: '/protocols', icon: Database },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Receipts', href: '/receipts', icon: RefreshCw },
  { name: 'Email Health', href: '/email-health', icon: Activity },
  { name: 'Design Partners', href: '/design-partners', icon: Handshake },
  { name: 'Incidents', href: '/incidents', icon: ShieldAlert },
  { name: 'Team', href: '/team', icon: Users },
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { data: session } = useSession()

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
        {/* Expand Toggle (Desktop Only to avoid duplicate with footer) */}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex h-6 w-6 rounded hover:bg-card-2 items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Collapse Toggle (Desktop + Mobile) */}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="flex h-6 w-6 rounded hover:bg-card-2 items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Mobile Close Button */}
        <button
          onClick={() => useUiStore.getState().setMobileSidebarOpen(false)}
          className="flex lg:hidden h-6 w-6 rounded hover:bg-card-2 items-center justify-center text-text-muted transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Separator ─────────────────────────────── */}
      <div className="border-t border-border" />

      {/* ── Navigation ────────────────────────────── */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          const content = (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center h-10 rounded-lg px-2 transition-all duration-200',
                isActive
                  ? 'bg-teal/5 text-teal border-l-2 border-teal'
                  : 'text-text-muted hover:bg-card-2 hover:text-text-secondary border-l-2 border-transparent',
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-teal' : 'text-text-muted group-hover:text-text-secondary',
                )}
              />
              {!sidebarCollapsed && (
                <span className="ml-3 text-sm font-medium font-syne">
                  {item.name}
                </span>
              )}
            </Link>
          )

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.name} delayDuration={0}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            )
          }

          return content
        })}
      </nav>

      {/* ── User footer ───────────────────────────── */}
      <div className="border-t border-border p-3">
        {sidebarCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="mx-auto h-8 w-8 rounded-lg hover:bg-card-2 items-center justify-center text-text-muted transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-teal text-white flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold">{initials}</span>
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
              <Badge variant="growth" className="mt-0.5 px-1 py-0 text-[9px] uppercase tracking-wider">
                {role.replace('_', ' ')}
              </Badge>
            </div>

            {/* Sign out */}
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