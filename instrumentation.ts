export async function register() {
  const shouldMock =
    process.env.NODE_ENV === 'development' ||
    process.env.ENABLE_MOCKS === 'true'

  if (process.env.NEXT_RUNTIME === 'nodejs' && shouldMock) {
    try {
      const { server } = await import('./mocks/server')
      server.listen({ onUnhandledRequest: 'bypass' })
      console.log('✅ [MSW] Mock server started')
    } catch (err) {
      console.error('❌ [MSW] Failed to start mock server:', err)
    }
  }
}
