'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { SidebarNav } from './sidebar'
import { Topnav } from './topnav'
import { useUiStore } from '@/lib/stores/ui-store'

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore()
  const pathname = usePathname()

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname, setMobileSidebarOpen])

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar — hidden below lg */}
      <div className="hidden lg:flex">
        <SidebarNav />
      </div>

      {/* Mobile sidebar — Radix Dialog off-canvas drawer */}
      <Dialog.Root open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 lg:hidden w-[260px] animate-in slide-in-from-left duration-300 focus:outline-none">
            <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
            <Dialog.Description className="sr-only">Main navigation sidebar</Dialog.Description>
            <SidebarNav />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topnav />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}