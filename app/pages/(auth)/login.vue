<script setup lang="ts">
import { z } from "zod"
import { AutoForm } from "@/components/ui/auto-form"
import { toast } from "vue-sonner"

definePageMeta({
  layout: "auth",
})

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
})

const isLoading = ref(false)

async function onSubmit(values: { email: string; password: string }) {
  isLoading.value = true
  try {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    })
    if (error) {
      throw error
    }
    toast.success("Login successful")
    navigateTo("/tickers")
  } catch (error: unknown) {
    if (error instanceof Error) {
      toast.error(error.message)
    } else {
      toast.error("Failed to login")
    }
  } finally {
    isLoading.value = false
  }
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
          <UiButton
            :loading="isLoading"
            type="submit"
            >Sign in</UiButton
          >
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
