import { db } from "~~/server/database"
import { userTickers, recommendations } from "~~/server/database/schema"
import { eq, desc, inArray } from "drizzle-orm"
import type { GeminiRecommendation } from "~~/server/types"
import { auth } from "~~/server/auth"

export default defineEventHandler(async (event) => {
  const user = await auth.api.getSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    })
  }
  const userId = user.user.id

  try {
    const tickers = await db
      .select()
      .from(userTickers)
      .where(eq(userTickers.userId, userId))
      .orderBy(desc(userTickers.createdAt))

    if (tickers.length === 0) {
      return [] // Return empty array if no tickers found for the user
    }

    const tickerSymbols = tickers.map((t) => t.symbol)

    const allRecsForUserTickers = await db
      .select()
      .from(recommendations)
      .where(inArray(recommendations.symbol, tickerSymbols))
      .orderBy(desc(recommendations.updatedAt))

    const recommendationMap = new Map<string, GeminiRecommendation>()

    for (const rec of allRecsForUserTickers) {
      if (!recommendationMap.has(rec.symbol)) {
        recommendationMap.set(rec.symbol, rec.recommendation)
      }
    }

    const result = tickers.map((ticker) => ({
      ...ticker,
      recommendation: recommendationMap.get(ticker.symbol) || null,
    }))

    return result
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode: unknown }).statusCode === "number" &&
      "statusMessage" in error &&
      typeof (error as { statusMessage: unknown }).statusMessage === "string"
    ) {
      throw error
    }
    console.error("Error fetching user tickers list:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "An unexpected error occurred while fetching tickers.",
      data: error instanceof Error ? error.message : String(error),
    })
  }
})
