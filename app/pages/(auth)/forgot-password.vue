<script setup lang="ts">
import { z } from "zod"
import { AutoForm } from "@/components/ui/auto-form"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})

async function onSubmit(values: { email: string }) {
  await authClient.forgetPassword({
    email: values.email,
  })
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
        class="mt-4"
        :schema="forgotPasswordSchema"
        @submit="onSubmit"
      />
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
