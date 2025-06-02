import { db } from "~~/server/database"
import { userTickers } from "~~/server/database/schema"
import { auth } from "~~/server/auth"
import { z } from "zod"
import { sql } from "drizzle-orm"

const addTickerSchema = z.object({
  symbol: z.string().min(1).max(10), // Basic validation for a ticker symbol
})

export default defineEventHandler(async (event) => {
  const user = await auth.api.getSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    })
  }
  const userId = user.user.id

  const body = await readBody(event)

  const parseResult = addTickerSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request body",
      data: parseResult.error.issues,
    })
  }

  const { symbol } = parseResult.data

  try {
    // Check if the user is already tracking this ticker
    const existingTicker = await db
      .select()
      .from(userTickers)
      .where(
        sql`${userTickers.userId} = ${userId} AND ${
          userTickers.symbol
        } = ${symbol.toUpperCase()}`
      )
      .limit(1)

    if (existingTicker.length > 0) {
      return {
        success: true,
        message: "Ticker already tracked",
        data: existingTicker[0],
      }
    }

    const newTicker = await db
      .insert(userTickers)
      .values({
        userId,
        symbol: symbol.toUpperCase(), // Store symbol in uppercase for consistency
        // createdAt will be set by default by the database if configured
      })
      .returning()

    if (!newTicker || newTicker.length === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to add ticker to database",
      })
    }

    return {
      success: true,
      message: "Ticker added successfully",
      data: newTicker[0],
    }
  } catch (error: unknown) {
    console.error("Error adding ticker:", error)
    // Handle potential database errors or other issues
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode: unknown }).statusCode === "number"
    ) {
      throw error // Re-throw errors that are already Nitro errors
    }
    throw createError({
      statusCode: 500,
      statusMessage: "An unexpected error occurred while adding the ticker.",
      data: error instanceof Error ? error.message : String(error),
    })
  }
})
