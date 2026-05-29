import {
  LayoutDashboard,
  Database,
  Bell,
  RefreshCw,
  Activity,
  Users,
  ShieldAlert,
  Handshake,
  Shield,
  FileCode,
  Flag,
  BarChart2,
  Wrench,
  DollarSign,
  MessageCircle,
  Cpu,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  /** Key into OverviewStats or a sidebar-badge store — shows a numeric badge when > 0 */
  badgeKey?: string
}

export interface NavGroup {
  label: string | null
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Customers',
    items: [
      { name: 'Protocols',       href: '/protocols',       icon: Database,   badgeKey: 'pendingVerifications' },
      { name: 'Design Partners', href: '/design-partners', icon: Handshake },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Failed Receipts', href: '/receipts',    icon: RefreshCw, badgeKey: 'failedReceipts' },
      { name: 'Email Health',   href: '/email-health', icon: Activity },
    ],
  },
  {
    label: 'Trust & Safety',
    items: [
      { name: 'Moderation',     href: '/moderation', icon: Shield,   badgeKey: 'pendingModeration' },
      { name: 'Templates',      href: '/templates',  icon: FileCode, badgeKey: 'pendingTemplates' },
      { name: 'Abuse Reports',  href: '/reports',    icon: Flag },
    ],
  },
  {
    label: 'Incidents',
    items: [
      { name: 'Incidents', href: '/incidents', icon: ShieldAlert, badgeKey: 'openIncidents' },
    ],
  },
  {
    label: 'Support',
    items: [
      { name: 'Tickets', href: '/support', icon: MessageCircle, badgeKey: 'openSupportTickets' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { name: 'Solana Wallets', href: '/infrastructure', icon: Cpu },
      { name: 'AWS Costs',      href: '/aws-costs',      icon: DollarSign },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart2 },
      { name: 'Billing',   href: '/billing',   icon: DollarSign },
      { name: 'Team',      href: '/team',       icon: Users },
      { name: 'Tools',     href: '/tools',      icon: Wrench },
    ],
  },
]

/** Flat list used by the command palette for navigation items */
export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)
