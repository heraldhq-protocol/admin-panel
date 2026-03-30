'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/cn'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function cycle() {
    if (theme === 'system') setTheme('light')
    else if (theme === 'light') setTheme('dark')
    else setTheme('system')
  }

  const icon =
    theme === 'light' ? <Sun className="h-4 w-4" /> :
    theme === 'dark'  ? <Moon className="h-4 w-4" /> :
                        <Monitor className="h-4 w-4" />

  return (
    <button
      onClick={cycle}
      aria-label="Toggle theme"
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg',
        'text-text-muted hover:bg-card-2 hover:text-text-primary transition-colors',
      )}
    >
      {icon}
    </button>
  )
}