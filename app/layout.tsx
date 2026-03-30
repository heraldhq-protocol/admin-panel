import type { Metadata } from 'next'
import { Syne, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/components/auth/auth-provider'
import { Providers } from './providers'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Herald Admin',
  description: 'Internal operations panel',
  robots: 'noindex, nofollow',
}

/* eslint-disable import/no-default-export */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${syne.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg font-sans antialiased text-text-primary">
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  )
}
