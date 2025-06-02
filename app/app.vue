<script setup lang="ts">
import { Toaster } from "@/components/ui/sonner"
import "vue-sonner/style.css"
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster
      rich-colors
      position="top-right"
    />
  </div>
</template>
