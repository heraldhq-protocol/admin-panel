'use client'

import { useSession } from 'next-auth/react'
import { Bell, Search, Sun, Moon, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from './ui/button'

export function Topbar() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-teal transition-colors" />
          <input
            type="text"
            placeholder="Search protocols or wallets..."
            className="w-full bg-card-2 border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 h-2 w-2 bg-admin rounded-full ring-2 ring-card" />
        </Button>

        <div className="h-8 w-px bg-border mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-text-primary leading-none">
              {session?.user?.name || 'Admin'}
            </p>
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-1">
              {session?.user?.role || 'Operator'}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-teal/10 flex items-center justify-center border border-teal/20 text-teal">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  )
}
