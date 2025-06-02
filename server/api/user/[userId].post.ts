import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { userTickers } from "~~/server/database/schema"
import { db } from "~~/server/database"

const paramsSchema = z.object({
  userId: z.string().min(1, "User ID cannot be empty"),
})

const bodySchema = z.object({
  symbol: z.string().min(1, "Symbol cannot be empty").toUpperCase(),
})

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { symbol } = await readValidatedBody(event, bodySchema.parse)

  try {
    // Check if the ticker already exists for this user
    const existingTicker = await db
      .select()
      .from(userTickers)
      .where(
        and(eq(userTickers.userId, userId), eq(userTickers.symbol, symbol))
      )
      .limit(1)

    if (existingTicker.length > 0) {
      throw createError({
        statusCode: 409, // Conflict
        statusMessage: "Ticker already exists in the user's list.",
      })
    }

    // Add the new ticker
    const [newUserTicker] = await db
      .insert(userTickers)
      .values({
        userId,
        symbol,
      })
      .returning()

    if (!newUserTicker) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to add ticker to user's list.",
      })
    }

    return {
      statusCode: 201, // Created
      message: "Ticker added successfully",
      data: newUserTicker,
    }
  } catch (error: unknown) {
    console.error("Error adding ticker to user's list:", error)
    if (error instanceof Error) {
      throw createError({
        statusCode: 500,
        statusMessage: "An unexpected error occurred.",
        data: (error as Error).message,
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: "An unexpected error occurred.",
    })
  }
})
