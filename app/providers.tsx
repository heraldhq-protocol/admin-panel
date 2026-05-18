'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, useTheme } from 'next-themes'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { MswProvider } from '../components/auth/msw-provider'

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
          mutations: { retry: 0 },
        },
      }),
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <MswProvider>
          <QueryClientProvider client={queryClient}>
            <ThemedToaster />
            {children}
          </QueryClientProvider>
        </MswProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
