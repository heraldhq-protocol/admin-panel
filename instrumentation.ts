export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'development') {
    try {
      const { server } = await import('./mocks/server')
      server.listen({ onUnhandledRequest: 'bypass' })
      console.log('✅ [MSW] Mock server started')
    } catch (err) {
      console.error('❌ [MSW] Failed to start mock server:', err)
    }
  }
}
