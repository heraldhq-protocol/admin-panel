'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, MonitorSmartphone } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  function cycle() {
    if (theme === 'system') setTheme('light')
    else if (theme === 'light') setTheme('dark')
    else setTheme('system')
  }

  const label =
    theme === 'system' ? 'System theme' :
    theme === 'light'  ? 'Light theme' :
                         'Dark theme'

  const icon =
    theme === 'system'
      ? <MonitorSmartphone className="h-4 w-4" />
      : resolvedTheme === 'dark'
        ? <Moon className="h-4 w-4" />
        : <Sun className="h-4 w-4" />

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          onClick={cycle}
          aria-label={label}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'text-text-muted hover:bg-card-2 hover:text-text-primary transition-colors',
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}