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
