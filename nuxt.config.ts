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
    scheduledTasks: {
      "*/1 * * * * *": ["log"],
    },
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
    alphaVantageApiKey: "",
  },
  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "shadcn-nuxt",
  ],
})
