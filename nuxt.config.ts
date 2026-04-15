export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  srcDir: 'app/',
  ssr: false,
  app: {
    baseURL: '/',
  },
  routeRules: {
    '/admin': { ssr: false },
  },
  nitro: {
    routeRules: {
      '/admin': {
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          'Cross-Origin-Embedder-Policy': 'unsafe-none',
        }
      }
    }
  }
})