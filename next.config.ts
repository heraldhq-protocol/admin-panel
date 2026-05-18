import type { NextConfig } from 'next'

// Fail the build immediately if running in production without a real TOTP secret.
// This prevents the dev-only bypass from ever reaching a deployed environment.
if (process.env.NODE_ENV === 'production' && !process.env.TOTP_SECRET) {
  throw new Error(
    '[Herald] TOTP_SECRET env var must be set in production. ' +
    'Set it in your deployment environment before building.'
  )
}

const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
