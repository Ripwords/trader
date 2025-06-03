export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)

  const authPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ]

  if (!session.value) {
    if (!authPaths.includes(to.path)) {
      return navigateTo("/login")
    }
  }
})
