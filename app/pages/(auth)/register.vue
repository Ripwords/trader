<script setup lang="ts">
import { z } from "zod"
import { AutoForm } from "@/components/ui/auto-form"

definePageMeta({
  layout: "auth",
})

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

async function onSubmit(values: {
  name: string
  email: string
  password: string
  confirmPassword: string
}) {
  await authClient.signUp.email({
    email: values.email,
    password: values.password,
    name: values.name,
  })
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-background px-4"
  >
    <div class="w-full max-w-md bg-white dark:bg-card shadow-lg rounded-lg p-8">
      <h1 class="text-2xl font-bold mb-6 text-center">Create your account</h1>
      <AutoForm
        class="space-y-4"
        :schema="registerSchema"
        @submit="onSubmit"
      >
        <div class="flex justify-center items-center">
          <UiButton type="submit">Create account</UiButton>
        </div>
      </AutoForm>
      <div class="flex justify-center mt-4 text-sm">
        <NuxtLink
          to="/login"
          class="text-primary hover:underline"
          >Already have an account? Sign in</NuxtLink
        >
      </div>
    </div>
  </div>
</template>
