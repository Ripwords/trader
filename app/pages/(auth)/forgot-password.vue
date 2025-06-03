<script setup lang="ts">
import { z } from "zod"
import { AutoForm } from "@/components/ui/auto-form"
import { toast } from "vue-sonner"

definePageMeta({
  layout: "auth",
})

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})

const isLoading = ref(false)

async function onSubmit(values: { email: string }) {
  isLoading.value = true
  try {
    const { error } = await authClient.forgetPassword({
      email: values.email,
      redirectTo: "/reset-password",
    })
    if (error) {
      throw error
    }
    toast.success("Password reset email sent")
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message)
    } else {
      toast.error("Failed to send password reset email")
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
      <h1 class="text-2xl font-bold mb-6 text-center">Forgot your password?</h1>
      <p class="mb-4 text-center text-gray-600 dark:text-gray-400 text-sm">
        Enter your email and we'll send you a password reset link.
      </p>
      <AutoForm
        class="space-y-4"
        :schema="forgotPasswordSchema"
        @submit="onSubmit"
      >
        <div class="flex justify-center items-center">
          <UiButton
            :disabled="isLoading"
            type="submit"
          >
            Reset password
          </UiButton>
        </div>
      </AutoForm>
      <div class="flex justify-center mt-4 text-sm">
        <NuxtLink
          to="/login"
          class="text-primary hover:underline"
          >Back to login</NuxtLink
        >
      </div>
    </div>
  </div>
</template>
