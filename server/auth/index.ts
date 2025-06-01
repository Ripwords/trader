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
  },
})
