'use client'

import { SidebarNav } from './sidebar'
import { Topnav } from './topnav'

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-bg">
      <SidebarNav />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topnav />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}