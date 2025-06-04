import {
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import type { GeminiRecommendation } from "../utils/googleGemini"

export * from "../auth/schema"

export const recommendations = pgTable(
  "recommendations",
  {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(),
    riskAppetite: text("risk_appetite").notNull(),
    recommendation: jsonb("recommendation")
      .notNull()
      .$type<GeminiRecommendation>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (recommendations) => [
    uniqueIndex("symbol_risk_appetite_idx").on(
      recommendations.symbol,
      recommendations.riskAppetite
    ),
  ]
)

export const userTickers = pgTable("user_tickers", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const userApiKeys = pgTable("user_api_keys", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  geminiApiKey: text("gemini_api_key"),
  polygonApiKey: text("polygon_api_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
})
