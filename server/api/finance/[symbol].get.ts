import { z } from "zod"
import type {
  TransformedPolygonStockData,
  TransformedPolygonNewsArticle,
  TransformedPolygonShortInterest,
  TransformedPolygonMACD,
} from "../../utils/polygon"
import {
  fetchDailyStockData,
  fetchPolygonNews,
  fetchShortInterest,
  fetchMACD,
  fetchWeeklyStockData,
} from "../../utils/polygon"
import { getInvestmentRecommendation } from "../../utils/googleGemini"
import { recommendations } from "../../database/schema"
import { eq, and, desc, gt } from "drizzle-orm"
import { db } from "../../database"

const querySchema = z.object({
  riskAppetite: z.string().optional().default("medium"),
})

const paramsSchema = z.object({
  symbol: z.string().min(1, "Symbol cannot be empty"),
})

interface FinanceResponse {
  dailyStockData?: TransformedPolygonStockData[] | null
  weeklyStockData?: TransformedPolygonStockData[] | null
  polygonNews?: TransformedPolygonNewsArticle[] | null
  shortInterest?: TransformedPolygonShortInterest[] | null
  macd?: TransformedPolygonMACD | null
  errors?: {
    stock?: string
    weeklyStock?: string
    polygonNews?: string
    shortInterest?: string
    macd?: string
    other?: string | string[]
  }
  data?: typeof recommendations.$inferSelect
}

defineRouteMeta({
  openAPI: {
    summary: "Polygon.io data fetching and Gemini recommendation",
    description:
      "Fetches daily/weekly stock data, news, short interest, and MACD from Polygon.io for a given stock symbol, and gets an investment recommendation from Gemini.",
    tags: ["Finance"],
    parameters: [
      {
        name: "symbol",
        in: "path",
        required: true,
      },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              riskAppetite: {
                type: "string",
                description: "User risk appetite (e.g., low, medium, high)",
                default: "medium",
              },
            },
            required: ["riskAppetite"],
          },
        },
      },
    },
    responses: {
      200: {
        description: "Successful data retrieval or partial data with errors.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "object",
                  properties: {
                    recommendation: {
                      type: "string",
                      enum: ["BUY", "SELL", "HOLD"],
                    },
                    confidence_level: {
                      type: "string",
                      enum: ["Low", "Medium", "High"],
                    },
                    justification: { type: "string" },
                    key_risks: { type: "string" },
                    data_limitations: { type: "string" },
                    sentiment_analysis: { type: "string" },
                    technical_snapshot: { type: "string" },
                  },
                },
                errors: {
                  type: "object",
                  properties: {
                    stock: { type: "string" },
                    weeklyStock: { type: "string" },
                    polygonNews: { type: "string" },
                    shortInterest: { type: "string" },
                    macd: { type: "string" },
                    other: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid request body.",
      },
      500: {
        description: "Internal server error or API key issue.",
      },
    },
  },
})

export default defineCachedEventHandler(
  async (event) => {
    const errors: FinanceResponse["errors"] = {}

    const { symbol } = await getValidatedRouterParams(event, paramsSchema.parse)
    const { riskAppetite } = await getValidatedQuery(event, querySchema.parse)

    if (!symbol) {
      throw createError({
        statusCode: 400,
        statusMessage: "Symbol is required",
      })
    }

    const { polygonApiKey, geminiApiKey } = useRuntimeConfig()

    // Check for existing recommendation in DB
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const [existingRecommendation] = await db
      .select()
      .from(recommendations)
      .where(
        and(
          eq(recommendations.symbol, symbol),
          eq(recommendations.riskAppetite, riskAppetite),
          gt(recommendations.updatedAt, oneHourAgo)
        )
      )
      .orderBy(desc(recommendations.updatedAt))
      .limit(1)

    if (existingRecommendation && existingRecommendation.recommendation) {
      return {
        data: existingRecommendation,
      }
    }

    if (typeof polygonApiKey !== "string" || !polygonApiKey) {
      console.error(
        "Polygon.io API key is not configured correctly or is not a string in runtime config."
      )
      return {
        errors: {
          other:
            "Polygon.io API key is not configured. Please set NUXT_POLYGON_API_KEY.",
        },
      }
    }
    if (typeof geminiApiKey !== "string" || !geminiApiKey) {
      return {
        errors: {
          other:
            "Gemini API key is not configured. Please set NUXT_GEMINI_API_KEY.",
        },
      }
    }

    let dailyStockData: TransformedPolygonStockData[] | null = null
    let weeklyStockData: TransformedPolygonStockData[] | null = null
    let polygonNewsData: TransformedPolygonNewsArticle[] | null = null
    let shortInterestData: TransformedPolygonShortInterest[] | null = null
    let macdData: TransformedPolygonMACD | null = null

    const [
      dailyRawData,
      weeklyRawData,
      polygonNewsRawData,
      shortInterestRawData,
      macdRawData,
    ] = await Promise.allSettled([
      fetchDailyStockData(polygonApiKey, symbol, 60),
      fetchWeeklyStockData(polygonApiKey, symbol, 52),
      fetchPolygonNews(polygonApiKey, symbol, 10),
      fetchShortInterest(polygonApiKey, symbol, 12),
      fetchMACD(polygonApiKey, symbol, {
        timespan: "day",
        limit: 60,
        order: "desc",
      }),
    ])

    if (dailyRawData.status === "fulfilled") dailyStockData = dailyRawData.value
    else
      errors.stock = `Error fetching daily stock data: ${dailyRawData.reason}`
    if (!dailyStockData || dailyStockData.length === 0)
      errors.stock = errors.stock || `No daily stock data for ${symbol}.`

    if (weeklyRawData.status === "fulfilled")
      weeklyStockData = weeklyRawData.value
    else
      errors.weeklyStock = `Error fetching weekly stock data: ${weeklyRawData.reason}`
    if (!weeklyStockData || weeklyStockData.length === 0)
      errors.weeklyStock =
        errors.weeklyStock || `No weekly stock data for ${symbol}.`

    if (polygonNewsRawData.status === "fulfilled")
      polygonNewsData = polygonNewsRawData.value
    else
      errors.polygonNews = `Error fetching Polygon news: ${polygonNewsRawData.reason}`
    if (!polygonNewsData || polygonNewsData.length === 0)
      errors.polygonNews =
        errors.polygonNews || `No Polygon news for ${symbol}.`

    if (shortInterestRawData.status === "fulfilled")
      shortInterestData = shortInterestRawData.value
    else
      errors.shortInterest = `Error fetching short interest: ${shortInterestRawData.reason}`
    if (!shortInterestData || shortInterestData.length === 0)
      errors.shortInterest =
        errors.shortInterest || `No short interest data for ${symbol}.`

    if (macdRawData.status === "fulfilled") macdData = macdRawData.value
    else errors.macd = `Error fetching MACD: ${macdRawData.reason}`
    if (!macdData || !macdData.values || macdData.values.length === 0)
      errors.macd = errors.macd || `No MACD data for ${symbol}.`

    const response: FinanceResponse = {}
    if (Object.keys(errors).length > 0) {
      response.errors = errors
    }

    const newsSummaryForGemini =
      polygonNewsData
        ?.map((n) => n.summary || n.description || "")
        .join("\n") || "No news summary available."

    if (dailyStockData && dailyStockData.length > 0) {
      const stockDataForGemini = {
        daily: dailyStockData,
        weekly: weeklyStockData,
        macd: macdData,
        shortInterest: shortInterestData,
      }

      try {
        const geminiResult = await getInvestmentRecommendation(
          newsSummaryForGemini,
          riskAppetite,
          JSON.stringify(stockDataForGemini),
          true
        )

        if (geminiResult) {
          if (!geminiResult.error) {
            const [result] = await db
              .insert(recommendations)
              .values({
                symbol,
                riskAppetite,
                recommendation: geminiResult,
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: [recommendations.symbol, recommendations.riskAppetite],
                set: {
                  recommendation: geminiResult,
                  updatedAt: new Date(),
                },
              })
              .returning()

            response.data = result
          }
        } else {
          if (response.errors) {
            response.errors.other =
              "Failed to retrieve investment recommendation from AI service."
          } else {
            response.errors = {
              other:
                "Failed to retrieve investment recommendation from AI service.",
            }
          }
        }
      } catch (e: unknown) {
        console.error(`Error generating recommendation for ${symbol}:`, e)
        if (response.errors) {
          response.errors.other =
            "An unexpected error occurred while generating the recommendation."
        } else {
          response.errors = {
            other:
              "An unexpected error occurred while generating the recommendation.",
          }
        }
      }
    } else {
      if (response.errors) {
        response.errors.other =
          "Insufficient stock data to generate a recommendation."
      } else {
        response.errors = {
          other: "Insufficient stock data to generate a recommendation.",
        }
      }
    }

    return response
  },
  {
    maxAge: 60 * 15,
    swr: false,
    name: "financeRecommendation",
    getKey: async (event) => {
      const { symbol } = await getValidatedRouterParams(
        event,
        paramsSchema.parse
      )
      const { riskAppetite } = await getValidatedQuery(event, querySchema.parse)
      return `${symbol}:${riskAppetite}`
    },
  }
)
