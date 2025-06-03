import tailwindcss from "@tailwindcss/vite"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  experimental: {
    typedPages: true,
  },
  nitro: {
    experimental: {
      openAPI: true,
      tasks: true,
    },
    scheduledTasks: {},
  },
  security: {
    headers: {
      contentSecurityPolicy: {
        "frame-src": [
          "'self'",
          "https://*.tradingview.com",
          "https://s.tradingview.com",
          "https://charting-library.tradingview.com",
          "https://www.tradingview-widget.com",
        ],
        "script-src": [
          "'self'",
          "https:",
          "'unsafe-inline'",
          "'strict-dynamic'",
          "'nonce-{{nonce}}'",
          "https://*.tradingview.com",
          "https://s.tradingview.com",
          "https://www.tradingview-widget.com",
        ],
        "connect-src": [
          "'self'",
          "https://*.tradingview.com",
          "https://s.tradingview.com",
          "https://www.tradingview-widget.com",
          "wss://*.tradingview.com",
          "wss://www.tradingview-widget.com",
        ],
        "style-src": [
          "'self'",
          "https:",
          "'unsafe-inline'",
          "https://*.tradingview.com",
          "https://www.tradingview-widget.com",
        ],
      },
    },
  },
  routeRules: {
    "/api/finance/**": {
      security: {
        rateLimiter: {
          interval: 60,
        },
      },
    },
  },
  colorMode: {
    classSuffix: "",
  },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: "Ui",
    componentDir: "~/components/ui",
  },
  runtimeConfig: {
    databaseUrl: "",
    geminiApiKey: "",
    polygonApiKey: "",
    brevoKey: "",
    brevoEmail: "",
    brevoName: "",
    companyName: "",
  },
  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "shadcn-nuxt",
    "nuxt-security",
    "@nuxt/scripts",
    "nuxt-tradingview",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "dayjs-nuxt",
  ],
})
