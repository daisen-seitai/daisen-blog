export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  routeRules: {
    '/': { prerender: true },
    '/post/**': { prerender: false },
    '/admin': { ssr: false },
  }
})