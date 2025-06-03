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
      crossOriginResourcePolicy: "cross-origin",
      crossOriginEmbedderPolicy: "unsafe-none",
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
          "https://ticker-2e1ica8b9.now.sh",
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
    experimental: {
      enableNativePlugin: true,
    },
  },
  shadcn: {
    prefix: "Ui",
    componentDir: "~/components/ui",
  },
  pwa: {
    base: "/",
    strategies: "generateSW",
    workbox: {
      // Only precache these files - html should be excluded
      globPatterns: ["**/*.{js,css}"],
      // Don't fallback on document based (e.g. `/some-page`) requests
      // Even though this says `null` by default, I had to set this specifically to `null` to make it work
      navigateFallback: null,
    },
    injectManifest: {
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
    },
    manifest: {
      name: "Trader",
      short_name: "Trader",
      description: "Trader",
      lang: "en",
      theme_color: "#000000",
      background_color: "#000000",
      display: "standalone",
      icons: [
        {
          src: "img/icons/manifest-icon-192.maskable.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "img/icons/manifest-icon-192.maskable.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "img/icons/manifest-icon-512.maskable.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "img/icons/manifest-icon-512.maskable.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
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
    "@vite-pwa/nuxt",
  ],
})
