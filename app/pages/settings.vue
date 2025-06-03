<script setup lang="ts">
import { toast } from "vue-sonner"
import { authClient, useSession } from "~/utils/auth"
const session = useSession()

const passkeyLoading = useState("passkeyLoading", () => false)
const passwordLoading = useState("passwordLoading", () => false)
const currentPassword = useState("currentPassword", () => "")
const newPassword = useState("newPassword", () => "")
const confirmPassword = useState("confirmPassword", () => "")

// Browser support detection
const browserSupport = useState("browserSupport", () => ({
  webauthn: false,
  conditionalUI: false,
}))

// Check browser support on mount
onMounted(async () => {
  // Check WebAuthn support
  browserSupport.value.webauthn = !!window.PublicKeyCredential

  // Check Conditional UI support
  if (window.PublicKeyCredential?.isConditionalMediationAvailable) {
    try {
      browserSupport.value.conditionalUI =
        await window.PublicKeyCredential.isConditionalMediationAvailable()
    } catch {
      browserSupport.value.conditionalUI = false
    }
  }
})

const { data: passkeys, refresh } = useAsyncData("passkeys", async () => {
  try {
    const { data } = await authClient.passkey.listUserPasskeys()
    return data
  } catch (error) {
    console.error("Error fetching passkeys:", error)
    return []
  }
})

async function handleAddPasskey(
  authenticatorAttachment?: "platform" | "cross-platform"
) {
  if (!session.value?.data?.user) {
    toast.error("Please sign in to add a passkey")
    return
  }

  if (!browserSupport.value.webauthn) {
    toast.error("Your browser does not support passkeys")
    return
  }

  passkeyLoading.value = true

  try {
    const options: { authenticatorAttachment?: "platform" | "cross-platform" } =
      {}

    if (authenticatorAttachment) {
      options.authenticatorAttachment = authenticatorAttachment
    }

    const result = await authClient.passkey.addPasskey(options)

    if (result?.error) {
      throw new Error(result.error.message || "Failed to add passkey")
    }

    const passkeyType =
      authenticatorAttachment === "platform"
        ? "biometric passkey"
        : authenticatorAttachment === "cross-platform"
        ? "security key"
        : "passkey"

    toast.success(
      `Successfully added ${passkeyType}! You can now use it to sign in.`
    )
    await refresh()
  } catch (error: unknown) {
    console.error("Error adding passkey:", error)

    // Handle specific error cases
    const errorName = error instanceof Error ? error.name : ""
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred"

    if (errorName === "NotAllowedError") {
      toast.error("Passkey registration was cancelled or not allowed")
    } else if (errorName === "InvalidStateError") {
      toast.error("A passkey for this account already exists on this device")
    } else if (errorName === "NotSupportedError") {
      toast.error("Passkeys are not supported on this device")
    } else {
      toast.error(errorMessage || "Failed to add passkey. Please try again.")
    }
  } finally {
    passkeyLoading.value = false
  }
}

async function deletePasskey(passkeyId: string, passkeyName?: string) {
  try {
    const result = await authClient.passkey.deletePasskey({ id: passkeyId })
    if (result?.error) {
      throw new Error(result.error.message || "Failed to delete passkey.")
    }
    toast.success(`Deleted passkey: ${passkeyName || passkeyId}`)
    await refresh()
  } catch (error: unknown) {
    if (error instanceof Error) {
      toast.error(error.message)
    } else {
      toast.error("Failed to delete passkey.")
    }
  }
}

async function handleChangePassword() {
  if (newPassword.value !== confirmPassword.value) {
    toast.error("New passwords do not match.")
    return
  }

  passwordLoading.value = true

  try {
    const result = await authClient.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      revokeOtherSessions: true,
    })

    if (result?.error) {
      throw new Error(result.error.message || "Failed to change password.")
    }

    toast.success("Password changed successfully!")
    currentPassword.value = ""
    newPassword.value = ""
    confirmPassword.value = ""
  } catch (error: unknown) {
    if (error instanceof Error) {
      toast.error(error.message)
    } else {
      toast.error("An unexpected error occurred during password change.")
    }
  } finally {
    passwordLoading.value = false
  }
}

function formatDate(dateString: string | Date): string {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-gray-50 dark:bg-background px-4 py-8"
  >
    <div class="w-full max-w-4xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Account Settings
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account security and preferences
        </p>
      </div>

      <!-- User Info Card -->
      <div class="w-full bg-white dark:bg-card shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Account Information
        </h2>
        <div
          v-if="session?.data?.user"
          class="space-y-2"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Email:</span>
            {{ session.data.user.email }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">Name:</span>
            {{ session.data.user.name || "Not set" }}
          </p>
        </div>
        <div
          v-else
          class="text-gray-500 dark:text-gray-400"
        >
          Loading account information...
        </div>
      </div>

      <!-- Passkey Management Card -->
      <div class="w-full bg-white dark:bg-card shadow-lg rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Passkey Management
            </h2>
            <p class="mt-1 text-gray-600 dark:text-gray-400">
              Secure your account with biometric authentication using passkeys
            </p>
          </div>
          <div class="flex items-center space-x-2 text-sm text-green-600">
            <svg
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span>Secure</span>
          </div>
        </div>

        <!-- Passkey Info -->
        <div
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6"
        >
          <div class="flex items-start">
            <svg
              class="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            <div>
              <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                What are passkeys?
              </h3>
              <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Passkeys are a secure, passwordless way to sign in using your
                device's biometrics (fingerprint, face ID) or security keys.
                They're more secure than passwords and can't be phished.
              </p>
            </div>
          </div>
        </div>

        <!-- Add Passkey Section -->
        <div class="space-y-4 mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Add New Passkey
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Platform Passkey (Biometric) -->
            <div
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="text-center">
                <svg
                  class="w-8 h-8 text-indigo-600 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                  Device Biometric
                </h4>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Fingerprint, Face ID, Windows Hello
                </p>
                <UiButton
                  class="w-full"
                  size="sm"
                  :loading="passkeyLoading"
                  @click="handleAddPasskey('platform')"
                >
                  Add Biometric
                </UiButton>
              </div>
            </div>

            <!-- Cross-Platform Passkey (Security Key) -->
            <div
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="text-center">
                <svg
                  class="w-8 h-8 text-green-600 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                  Security Key
                </h4>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  USB, NFC, Bluetooth security key
                </p>
                <UiButton
                  class="w-full"
                  size="sm"
                  :loading="passkeyLoading"
                  @click="handleAddPasskey('cross-platform')"
                >
                  Add Security Key
                </UiButton>
              </div>
            </div>

            <!-- Any Passkey Option -->
            <div
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="text-center">
                <svg
                  class="w-8 h-8 text-purple-600 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                  Any Available Method
                </h4>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Let your device choose
                </p>
                <UiButton
                  class="w-full"
                  size="sm"
                  :loading="passkeyLoading"
                  @click="handleAddPasskey()"
                >
                  Add Passkey
                </UiButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Registered Passkeys -->
        <UiCard v-if="passkeys?.length">
          <UiCardHeader>
            <UiCardTitle> Registered Passkeys </UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="space-y-3">
            <div
              v-for="key in passkeys"
              :key="key.id"
              class="flex items-center justify-between rounded-lg p-3"
            >
              <div class="flex items-center space-x-3">
                <svg
                  class="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ key.name || `Passkey ${key.id.substring(0, 6)}` }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Added {{ formatDate(key.createdAt) }} •
                    {{ key.deviceType }}
                  </p>
                </div>
              </div>
              <UiButton
                variant="destructive"
                aria-label="Delete passkey"
                @click="deletePasskey(key.id, key.name)"
              >
                <svg
                  class="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                    clip-rule="evenodd"
                  />
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </UiButton>
            </div>
          </UiCardContent>
        </UiCard>

        <!-- Browser Support Check -->
        <div class="mt-6 p-4 rounded-lg">
          <h4 class="text-sm font-medium mb-2">Browser Support</h4>
          <div class="flex items-center space-x-4 text-sm">
            <div class="flex items-center">
              <UiBadge
                class="mr-2"
                :variant="browserSupport.webauthn ? 'secondary' : 'destructive'"
              >
                <span>
                  WebAuthn:
                  {{ browserSupport.webauthn ? "Supported" : "Not Supported" }}
                </span>
              </UiBadge>
            </div>
            <div class="flex items-center">
              <UiBadge
                class="mr-2"
                :variant="
                  browserSupport.conditionalUI ? 'secondary' : 'destructive'
                "
              >
                <span>
                  Conditional UI:
                  {{
                    browserSupport.conditionalUI ? "Supported" : "Not Available"
                  }}
                </span>
              </UiBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Password Change Card -->
      <div class="w-full shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Change Password</h2>
        <p class="mb-6">Update your account password for enhanced security</p>

        <form
          class="space-y-4"
          @submit.prevent="handleChangePassword"
        >
          <div>
            <label
              for="currentPassword"
              class="block text-sm font-medium mb-1"
            >
              Current Password
            </label>
            <UiInput
              id="currentPassword"
              v-model="currentPassword"
              type="password"
              required
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label
              for="newPassword"
              class="block text-sm font-medium mb-1"
            >
              New Password
            </label>
            <UiInput
              id="newPassword"
              v-model="newPassword"
              type="password"
              required
              minlength="6"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label
              for="confirmPassword"
              class="block text-sm font-medium mb-1"
            >
              Confirm New Password
            </label>
            <UiInput
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              minlength="6"
              placeholder="Confirm new password"
            />
          </div>

          <div class="pt-4">
            <UiButton
              type="submit"
              :loading="passwordLoading"
              class="w-full"
            >
              Change Password
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
