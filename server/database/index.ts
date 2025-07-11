import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "./schema"

export const db = drizzle(process.env.NUXT_DATABASE_URL!, {
  schema,
})
