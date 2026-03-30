'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Wallet, Mail, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

export default function LoginPage() {
  const [method, setMethod] = React.useState<'wallet' | 'otp'>('wallet')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // OTP state
  const [email, setEmail] = React.useState('')
  const [code, setCode] = React.useState('')
  
  const router = useRouter()

  const handleWalletLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Simulate Solana wallet signature
      // In a real app, we would use @solana/wallet-adapter-react
      const result = await signIn('wallet', {
        publicKey: '7xR4mKp2nQwBvTsYjL8dHcFoEa3ZiXuWYnRp9zK2mS',
        signature: 'simulated_sig',
        message: 'Login to Herald Admin',
        redirect: false,
      })

      if (result?.error) {
        setError('Authentication failed')
      } else {
        router.push('/dashboard')
      }
    } catch (e) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const result = await signIn('email-totp', {
        email,
        code,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or code')
      } else {
        router.push('/dashboard')
      }
    } catch (e) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]">
      <div className="w-full max-w-md space-y-8 relative">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal mb-4 ring-1 ring-teal/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="font-syne text-3xl font-bold tracking-tight text-text-primary">
            Herald Admin
          </h1>
          <p className="text-text-secondary text-sm">
            Access the protocol control center
          </p>
        </div>

        <Card className="p-1 space-y-0 overflow-hidden border-border bg-card/50 backdrop-blur-sm">
          <div className="flex p-1 gap-1 bg-card-2/50 rounded-t-xl">
            <button
              onClick={() => setMethod('wallet')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all',
                method === 'wallet' 
                  ? 'bg-card text-text-primary shadow-sm ring-1 ring-border' 
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <Wallet className="h-4 w-4" />
              Wallet
            </button>
            <button
              onClick={() => setMethod('otp')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all',
                method === 'otp' 
                  ? 'bg-card text-text-primary shadow-sm ring-1 ring-border' 
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <Mail className="h-4 w-4" />
              Email OTP
            </button>
          </div>

          <div className="p-6">
            {method === 'wallet' ? (
              <div className="space-y-6 text-center">
                <p className="text-sm text-text-secondary">
                  Connect your authorized admin wallet to sign a secure message.
                </p>
                <Button 
                  className="w-full h-12 text-base font-bold" 
                  onClick={handleWalletLogin}
                  isLoading={isLoading}
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect & Sign
                </Button>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="developer">SuperAdmin Only</Badge>
                  <span className="text-[10px] text-text-muted italic">Non-custodial</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOtpLogin} className="space-y-4">
                <Input
                  label="Admin Email"
                  type="email"
                  placeholder="name@herald.hq"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                <Input
                  label="Verification Code"
                  type="text"
                  placeholder="000000"
                  required
                  mono
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  className="w-full h-11"
                  isLoading={isLoading}
                >
                  Verify Access
                </Button>
              </form>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-md bg-admin-bg border border-admin/20 text-admin text-xs font-medium text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
          </div>
        </Card>

        <p className="text-center text-[11px] text-text-muted uppercase tracking-widest font-bold">
          SECURE ENCLAVE ACTIVE
        </p>
      </div>
    </div>
  )
}