<script setup lang="ts">
import { Toaster } from "@/components/ui/sonner"
import "vue-sonner/style.css"

useSeoMeta({
  title: "Trader",
  description: "Trader",
})
</script>

<template>
  <div>
    <Toaster position="top-right" />
    <slot />
  </div>
</template>
