import type { NextConfig } from 'next'

// Fail the build in production if required env vars are missing.
if (process.env.NODE_ENV === 'production') {
  const required = ['NEXTAUTH_SECRET', 'HERALD_BACKEND_URL']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `[Herald] Missing required env vars for production build: ${missing.join(', ')}`
    )
  }
  if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true') {
    throw new Error('[Herald] NEXT_PUBLIC_ENABLE_MOCKS must not be true in production builds')
  }
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
