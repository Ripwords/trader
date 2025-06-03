<script lang="ts" setup>
import { z } from "zod"
import { toast } from "vue-sonner"

definePageMeta({
  layout: "auth",
})

const route = useRoute()
const token = route.query.token as string
if (!token) {
  toast.error("Invalid token")
  navigateTo("/login")
}

const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

const isLoading = ref(false)

async function onSubmit(values: z.infer<typeof newPasswordSchema>) {
  isLoading.value = true
  try {
    const { error } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    })
    if (error) {
      throw error
    }
    toast.success("Password reset successful")
    navigateTo("/login")
  } catch (error: unknown) {
    if (error instanceof Error) {
      toast.error(error.message)
    } else {
      toast.error("Failed to reset password")
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
      <h1 class="text-2xl font-bold mb-6 text-center">Reset Your Password</h1>
      <p class="mb-4 text-center text-gray-600 dark:text-gray-400 text-sm">
        Enter your new password below.
      </p>
      <UiAutoForm
        class="space-y-4"
        :schema="newPasswordSchema"
        @submit="onSubmit"
      >
        <div class="flex justify-center items-center">
          <UiButton
            :disabled="isLoading"
            type="submit"
          >
            Set New Password
          </UiButton>
        </div>
      </UiAutoForm>
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
