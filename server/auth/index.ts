import { betterAuth } from "better-auth"
import { openAPI } from "better-auth/plugins"

import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../database"
import * as schema from "./schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [openAPI()],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ url, user }) => {
      console.log(url)
      await sendEmail({
        to: user.email,
        name: user.name || "",
        subject: "Reset your password",
        content: `Click <a href="${url}">here</a> to reset your password.`,
      })
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ url, user }) => {
      await sendEmail({
        to: user.email,
        name: user.name,
        subject: "Verify your email",
        content: `Click <a href="${url}">here</a> to verify your email.`,
      })
    },
  },
})
