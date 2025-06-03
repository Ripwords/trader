<script setup lang="ts">
import { z } from "zod"
import { AutoForm } from "@/components/ui/auto-form"
import { toast } from "vue-sonner"
import { authClient } from "~/utils/auth"

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
const isPasskeyLoading = ref(false)
const hasPasskeySupport = ref(false)

// Check browser support and setup conditional UI
onMounted(async () => {
  hasPasskeySupport.value = !!window.PublicKeyCredential

  // Setup conditional UI for auto-fill if supported
  if (
    hasPasskeySupport.value &&
    window.PublicKeyCredential?.isConditionalMediationAvailable
  ) {
    try {
      const conditionalUISupported =
        await window.PublicKeyCredential.isConditionalMediationAvailable()
      if (conditionalUISupported) {
        // Enable passkey auto-fill
        void authClient.signIn.passkey({ autoFill: true })

        // Add webauthn autocomplete to inputs
        nextTick(() => {
          const inputs = document.querySelectorAll(
            'input[type="email"], input[type="password"]'
          )
          inputs.forEach((input) => {
            const currentAutocomplete = input.getAttribute("autocomplete") || ""
            if (!currentAutocomplete.includes("webauthn")) {
              input.setAttribute(
                "autocomplete",
                `${currentAutocomplete} webauthn`.trim()
              )
            }
          })
        })
      }
    } catch (error) {
      console.log("Conditional UI not supported:", error)
    }
  }
})

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

async function onPasskeySignIn() {
  isPasskeyLoading.value = true
  try {
    const result = await authClient.signIn.passkey()

    if (result?.error) {
      throw new Error(result.error.message || "Failed to sign in with passkey")
    }

    toast.success("Signed in successfully with passkey!")
    navigateTo("/tickers")
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === "NotAllowedError") {
        toast.error("Passkey sign-in was cancelled")
      } else {
        toast.error(error.message || "Failed to sign in with passkey")
      }
    } else {
      toast.error("Failed to sign in with passkey")
    }
  } finally {
    isPasskeyLoading.value = false
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

      <!-- Passkey Sign-in Button -->
      <div
        v-if="hasPasskeySupport"
        class="mb-4"
      >
        <UiButton
          class="w-full mb-4"
          variant="outline"
          :loading="isPasskeyLoading"
          @click="onPasskeySignIn"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
            />
          </svg>
          Sign in with Passkey
        </UiButton>

        <div class="relative mb-4">
          <div class="absolute inset-0 flex items-center">
            <span
              class="w-full border-t border-gray-300 dark:border-gray-600"
            />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span
              class="bg-white dark:bg-card px-2 text-gray-500 dark:text-gray-400"
            >
              Or continue with email
            </span>
          </div>
        </div>
      </div>

      <AutoForm
        class="space-y-4"
        :schema="loginSchema"
        @submit="onSubmit"
      >
        <div class="flex justify-center items-center">
          <UiButton
            :loading="isLoading"
            type="submit"
            class="w-full"
          >
            Sign in
          </UiButton>
        </div>
      </AutoForm>

      <div class="flex justify-between mt-4 text-sm">
        <NuxtLink
          to="/register"
          class="text-primary hover:underline"
        >
          Create account
        </NuxtLink>
        <NuxtLink
          to="/forgot-password"
          class="text-primary hover:underline"
        >
          Forgot password?
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
