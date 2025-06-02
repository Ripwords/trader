<script setup lang="ts">
import { z } from "zod"
import { AutoForm } from "@/components/ui/auto-form"

definePageMeta({
  layout: "auth",
})

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
})

async function onSubmit(values: { email: string; password: string }) {
  const { error } = await authClient.signIn.email({
    email: values.email,
    password: values.password,
  })
  if (error) {
    console.error(error)
  }
  navigateTo("/tickers")
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-background px-4"
  >
    <div class="w-full max-w-md bg-white dark:bg-card shadow-lg rounded-lg p-8">
      <h1 class="text-2xl font-bold mb-6 text-center">
        Sign in to your account
      </h1>
      <AutoForm
        class="space-y-4"
        :schema="loginSchema"
        @submit="onSubmit"
      >
        <div class="flex justify-center items-center">
          <UiButton type="submit">Sign in</UiButton>
        </div>
      </AutoForm>
      <div class="flex justify-between mt-4 text-sm">
        <NuxtLink
          to="/register"
          class="text-primary hover:underline"
          >Create account</NuxtLink
        >
        <NuxtLink
          to="/forgot-password"
          class="text-primary hover:underline"
          >Forgot password?</NuxtLink
        >
      </div>
    </div>
  </div>
</template>
