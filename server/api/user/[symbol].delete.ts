import { z } from "zod"
import { db } from "~~/server/database"
import { userTickers } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "~~/server/auth"

const paramsSchema = z.object({
  symbol: z.string().min(1, "Symbol cannot be empty").toUpperCase(),
})

export default defineEventHandler(async (event) => {
  const { symbol } = await getValidatedRouterParams(event, paramsSchema.parse)
  const user = await auth.api.getSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    })
  }
  const userId = user.user.id

  try {
    const result = await db
      .delete(userTickers)
      .where(
        and(eq(userTickers.userId, userId), eq(userTickers.symbol, symbol))
      )
      .returning() // .returning() gives back the deleted rows, if any

    if (result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Ticker not found in user's list or already deleted.",
      })
    }

    return {
      statusCode: 200,
      message: "Ticker removed successfully",
      data: result[0], // Return the details of the deleted ticker
    }
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
    console.error("Error deleting ticker from user's list:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "An unexpected error occurred while deleting the ticker.",
      data: error instanceof Error ? error.message : String(error),
    })
  }
})
