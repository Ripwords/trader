<script setup lang="ts">
import "vue-sonner/style.css"
import { Toaster } from "@/components/ui/sonner"

import AppSidebar from "~/components/AppSidebar.vue"
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"

useSeoMeta({
  title: "Trader",
  description: "Trader",
})

const sidebarOpen = ref(true)
</script>

<template>
  <SidebarProvider v-model:open="sidebarOpen">
    <Toaster
      rich-colors
      position="top-right"
    />
    <AppSidebar />
    <main
      class="p-4 transition-all duration-300 ease-in-out flex justify-center w-full"
    >
      <SidebarTrigger
        class="fixed top-4 right-4 z-50"
        aria-label="Toggle sidebar"
      />
      <slot />
    </main>
  </SidebarProvider>
</template>

<style>
html,
body {
  overflow-x: hidden;
}
</style>
