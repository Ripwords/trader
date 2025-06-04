import { z } from "zod"

const POLYGON_API_URL = "https://api.polygon.io"

// Zod schema for a single day's stock data from Polygon.io (Aggregates API)
const PolygonAggregatesResultSchema = z.object({
  o: z.number(), // Open
  h: z.number(), // High
  l: z.number(), // Low
  c: z.number(), // Close
  v: z.number(), // Volume
  vw: z.number().optional(), // Volume Weighted Average Price
  t: z.number(), // Timestamp (Unix ms)
  n: z.number().optional(), // Number of transactions
})

// Zod schema for the full Polygon.io Aggregates API response
const PolygonAggregatesResponseSchema = z.object({
  ticker: z.string().optional(), // Ticker symbol requested
  queryCount: z.number().optional(), // Number of aggregates queried
  resultsCount: z.number().optional(), // Number of results returned
  adjusted: z.boolean().optional(), // Whether aggregates are adjusted for splits
  results: z.array(PolygonAggregatesResultSchema).optional(),
  status: z.string().optional(), // e.g., "OK", "ERROR"
  request_id: z.string().optional(),
  message: z.string().optional(), // Error message if status is "ERROR"
})

export type TransformedPolygonStockData = {
  date: string // YYYY-MM-DD
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap?: number
  timestamp: number
  transactions?: number
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * Fetches and transforms daily stock data for a given ticker for the past N days.
 * Uses Polygon.io's Aggregates (Bars) API.
 */
export async function fetchDailyStockData(
  apiKey: string,
  ticker: string,
  days: number = 5
): Promise<TransformedPolygonStockData[] | null> {
  const today = new Date()
  const fromDate = new Date()
  fromDate.setDate(today.getDate() - days) // Get data for the last 'days' days

  const to = formatDate(today)
  const from = formatDate(fromDate)

  const params = new URLSearchParams({
    adjusted: "true",
    sort: "desc", // Get most recent first
    limit: days.toString(), // Limit to the number of days requested
    apiKey: apiKey,
  })

  const url = `${POLYGON_API_URL}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?${params.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) // Try to parse error
      console.error(
        `Polygon.io API error for ${ticker} (Aggregates): ${response.status} ${response.statusText}`,
        errorData
      )
      return null
    }

    const rawData = await response.json()
    const parsed = PolygonAggregatesResponseSchema.safeParse(rawData)

    if (!parsed.success) {
      console.error(
        `Failed to parse Polygon.io Aggregates response for ${ticker}:`,
        parsed.error.issues,
        "Raw data:",
        rawData
      )
      return null
    }

    const data = parsed.data

    if (data.status === "ERROR" || !data.results) {
      console.error(
        `Polygon.io API returned an error for ${ticker}: ${
          data.message || data.status
        }`,
        "Full response:",
        data
      )
      return null
    }

    if (data.results.length === 0) {
      console.warn(
        `No results found for ${ticker} from ${from} to ${to}. Raw response:`,
        rawData
      )
      return [] // Return empty array if no results but no API error
    }

    return data.results
      .map((agg) => ({
        date: formatDate(new Date(agg.t)),
        open: agg.o,
        high: agg.h,
        low: agg.l,
        close: agg.c,
        volume: agg.v,
        vwap: agg.vw,
        timestamp: agg.t,
        transactions: agg.n,
      }))
      .sort((a, b) => b.timestamp - a.timestamp) // Ensure descending order by timestamp
  } catch (error) {
    console.error(
      `Error fetching or parsing Polygon.io Aggregates for ${ticker}:`,
      error
    )
    return null
  }
}

// --- Polygon.io News API ---

const PolygonNewsPublisherSchema = z.object({
  name: z.string(),
  homepage_url: z.string().url().optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  favicon_url: z.string().url().optional().nullable(),
})

const PolygonNewsInsightSchema = z
  .object({
    // Define if needed, though the example doesn't detail its structure deeply.
    // For now, let's keep it simple or use z.unknown() if the structure is variable.
    // As per docs, it's an array of objects, but structure isn't specified in the provided snippet.
    // Assuming it might be complex or variable, let's use a placeholder or define if more info is available.
    // For now, we'll omit specific fields until more clarity or leave as z.record(z.string(), z.unknown())
  })
  .passthrough() // Allows unspecified fields

const PolygonNewsArticleSchema = z.object({
  id: z.string(),
  publisher: PolygonNewsPublisherSchema,
  title: z.string(),
  author: z.string().optional().nullable(),
  published_utc: z.string(), // RFC3339 date-time string
  article_url: z.string().url(),
  tickers: z.array(z.string()),
  amp_url: z.string().url().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional().nullable(),
  insights: z.array(PolygonNewsInsightSchema).optional().nullable(),
})

const PolygonNewsResponseSchema = z.object({
  results: z.array(PolygonNewsArticleSchema).optional(),
  status: z.string().optional(),
  request_id: z.string().optional(),
  next_url: z.string().url().optional().nullable(),
  count: z.number().optional(),
  message: z.string().optional(), // Error message
})

export type TransformedPolygonNewsArticle = {
  id: string
  publisher_name: string
  publisher_logo_url?: string | null
  title: string
  author?: string | null
  published_utc: Date
  article_url: string
  tickers: string[]
  image_url?: string | null
  description?: string | null
  summary?: string | null // Alias for description if a separate summary isn't provided
}

/**
 * Fetches news articles for a given ticker from Polygon.io.
 */
export async function fetchPolygonNews(
  apiKey: string,
  ticker: string,
  limit: number = 10 // Default to 10 articles, max 1000
): Promise<TransformedPolygonNewsArticle[] | null> {
  const params = new URLSearchParams({
    ticker: ticker,
    limit: limit.toString(),
    order: "desc", // Sort by published_utc descending (newest first)
    sort: "published_utc",
    apiKey: apiKey,
  })

  const url = `${POLYGON_API_URL}/v2/reference/news?${params.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(
        `Polygon.io API error for ${ticker} (News): ${response.status} ${response.statusText}`,
        errorData
      )
      return null
    }

    const rawData = await response.json()
    const parsed = PolygonNewsResponseSchema.safeParse(rawData)

    if (!parsed.success) {
      console.error(
        `Failed to parse Polygon.io News response for ${ticker}:`,
        parsed.error.issues,
        "Raw data:",
        rawData
      )
      return null
    }

    const data = parsed.data

    if (data.status === "ERROR" || !data.results) {
      console.error(
        `Polygon.io News API returned an error for ${ticker}: ${
          data.message || data.status
        }`,
        "Full response:",
        data
      )
      return null
    }

    if (data.results.length === 0) {
      console.warn(
        `No news results found for ${ticker} from Polygon.io. Raw response:`,
        rawData
      )
      return []
    }

    return data.results.map((article) => ({
      id: article.id,
      publisher_name: article.publisher.name,
      publisher_logo_url: article.publisher.logo_url,
      title: article.title,
      author: article.author,
      published_utc: new Date(article.published_utc),
      article_url: article.article_url,
      tickers: article.tickers,
      image_url: article.image_url,
      description: article.description,
      summary: article.description, // Using description as summary
    }))
  } catch (error) {
    console.error(
      `Error fetching or parsing Polygon.io News for ${ticker}:`,
      error
    )
    return null
  }
}

// --- Polygon.io Short Interest API ---

const PolygonShortInterestResultSchema = z.object({
  settlement_date: z.string(), // YYYY-MM-DD
  short_interest: z.number(),
  avg_daily_volume: z.number(),
  days_to_cover: z.number(),
  ticker: z.string().optional(),
})

const PolygonShortInterestResponseSchema = z.object({
  results: z.array(PolygonShortInterestResultSchema).optional(),
  status: z.string().optional(),
  request_id: z.string().optional(),
  next_url: z.string().url().optional().nullable(),
  message: z.string().optional(), // Error message
})

export type TransformedPolygonShortInterest = {
  settlementDate: string
  shortInterest: number
  averageDailyVolume: number
  daysToCover: number
  ticker?: string
}

/**
 * Fetches short interest data for a given ticker from Polygon.io.
 * Retrieves the most recent data points (default limit 10).
 */
export async function fetchShortInterest(
  apiKey: string,
  ticker: string,
  limit: number = 10
): Promise<TransformedPolygonShortInterest[] | null> {
  const params = new URLSearchParams({
    ticker: ticker, // This seems to be a path param in some docs, but query param in others. API ref /stocks/v1/short-interest shows it as query.
    limit: limit.toString(),
    sort: "settlement_date", // Sort by settlement_date descending
    order: "desc",
    apiKey: apiKey,
  })

  const url = `${POLYGON_API_URL}/stocks/v1/short-interest?${params.toString()}`
  // Corrected endpoint path from /stocks/v1/ to /v1/stocks based on common patterns, if this is wrong, adjust based on precise Polygon documentation for this specific endpoint version.
  // The provided URL was /stocks/v1/short-interest, which is unusual. Typically it is /vX/assetclass/feature. Will assume /v1/stocks/short-interest based on common structure for v1 endpoints.
  // Double checking the provided URL: https://polygon.io/docs/rest/stocks/fundamentals/short-interest states GET /stocks/v1/short-interest. So it is correct.
  // The API documentation uses /stocks/v1/short-interest, so my previous assumption was incorrect. Reverting to the documented path.

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(
        `Polygon.io API error for ${ticker} (Short Interest): ${response.status} ${response.statusText}`,
        errorData
      )
      return null
    }

    const rawData = await response.json()
    // The Short Interest API (as per docs) doesn't seem to wrap results in a top-level object like others,
    // but directly returns an object with a "results" array. Let's adjust parsing if necessary.
    // The provided documentation shows a response schema with next_url, request_id, results, status. So it is a wrapped response.
    const parsed = PolygonShortInterestResponseSchema.safeParse(rawData)

    if (!parsed.success) {
      console.error(
        `Failed to parse Polygon.io Short Interest response for ${ticker}:`,
        parsed.error.issues,
        "Raw data:",
        rawData
      )
      return null
    }

    const data = parsed.data

    if (data.status === "ERROR" || !data.results) {
      console.error(
        `Polygon.io Short Interest API returned an error for ${ticker}: ${
          data.message || data.status
        }`,
        "Full response:",
        data
      )
      return null
    }

    if (data.results.length === 0) {
      console.warn(
        `No short interest data found for ${ticker} from Polygon.io. Raw response:`,
        rawData
      )
      return []
    }

    return data.results.map((item) => ({
      settlementDate: item.settlement_date,
      shortInterest: item.short_interest,
      averageDailyVolume: item.avg_daily_volume,
      daysToCover: item.days_to_cover,
      ticker: item.ticker,
    }))
  } catch (error) {
    console.error(
      `Error fetching or parsing Polygon.io Short Interest for ${ticker}:`,
      error
    )
    return null
  }
}

// --- Polygon.io MACD API ---

const PolygonMACDValueSchema = z.object({
  timestamp: z.number(), // The timestamp for the MACD data point
  value: z.number(), // The MACD value
  signal: z.number(), // The MACD signal line value
  histogram: z.number(), // The MACD histogram value (MACD - Signal)
})

// Optional: Schema for underlying aggregate data if expand_underlying=true
const PolygonMACDUnderlyingResultSchema = z.object({
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number(),
  t: z.number(), // Timestamp
  n: z.number().optional(),
})

const PolygonMACDUnderlyingSchema = z.object({
  url: z.string().url(),
  results: z.array(PolygonMACDUnderlyingResultSchema).optional(),
})

const PolygonMACDResultsSchema = z.object({
  values: z.array(PolygonMACDValueSchema),
  underlying: PolygonMACDUnderlyingSchema.optional(), // Only if expand_underlying=true
})

const PolygonMACDResponseSchema = z.object({
  results: PolygonMACDResultsSchema.optional(),
  status: z.string().optional(),
  request_id: z.string().optional(),
  next_url: z.string().url().optional().nullable(),
  message: z.string().optional(), // Error message
})

export type TransformedPolygonMACDValue = {
  timestamp: number
  date: string // YYYY-MM-DD derived from timestamp
  macd: number
  signal: number
  histogram: number
}

export type TransformedPolygonMACD = {
  values: TransformedPolygonMACDValue[]
  // We can add underlying data here if needed later
}

/**
 * Fetches MACD (Moving Average Convergence/Divergence) data for a given ticker.
 */
export async function fetchMACD(
  apiKey: string,
  stockTicker: string,
  params?: {
    timestamp?: string // YYYY-MM-DD or millisecond timestamp
    timespan?: "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year"
    adjusted?: boolean
    short_window?: number // Defaults to 12
    long_window?: number // Defaults to 26
    signal_window?: number // Defaults to 9
    series_type?: "open" | "high" | "low" | "close" // Defaults to "close"
    expand_underlying?: boolean // Defaults to false
    order?: "asc" | "desc"
    limit?: number // Max 5000, defaults to 10 or more depending on API
  }
): Promise<TransformedPolygonMACD | null> {
  const queryParams = new URLSearchParams({
    apiKey: apiKey,
  })

  if (params?.timestamp) queryParams.append("timestamp", params.timestamp)
  if (params?.timespan) queryParams.append("timespan", params.timespan)
  if (params?.adjusted !== undefined)
    queryParams.append("adjusted", String(params.adjusted))
  if (params?.short_window)
    queryParams.append("short_window", String(params.short_window))
  if (params?.long_window)
    queryParams.append("long_window", String(params.long_window))
  if (params?.signal_window)
    queryParams.append("signal_window", String(params.signal_window))
  if (params?.series_type) queryParams.append("series_type", params.series_type)
  if (params?.expand_underlying !== undefined)
    queryParams.append("expand_underlying", String(params.expand_underlying))
  if (params?.order) queryParams.append("order", params.order)
  if (params?.limit) queryParams.append("limit", String(params.limit))
  else queryParams.append("limit", "50") // Default to a reasonable number like 50 if not specified

  const url = `${POLYGON_API_URL}/v1/indicators/macd/${stockTicker}?${queryParams.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(
        `Polygon.io API error for ${stockTicker} (MACD): ${response.status} ${response.statusText}`,
        errorData
      )
      return null
    }

    const rawData = await response.json()
    const parsed = PolygonMACDResponseSchema.safeParse(rawData)

    if (!parsed.success) {
      console.error(
        `Failed to parse Polygon.io MACD response for ${stockTicker}:`,
        parsed.error.issues,
        "Raw data:",
        rawData
      )
      return null
    }

    const data = parsed.data

    if (data.status === "ERROR" || !data.results || !data.results.values) {
      console.error(
        `Polygon.io MACD API returned an error or no values for ${stockTicker}: ${
          data.message || data.status
        }`,
        "Full response:",
        data
      )
      return null
    }

    if (data.results.values.length === 0) {
      console.warn(
        `No MACD data found for ${stockTicker} from Polygon.io. Raw response:`,
        rawData
      )
      return { values: [] }
    }

    return {
      values: data.results.values.map((v) => ({
        timestamp: v.timestamp,
        date: formatDate(new Date(v.timestamp)), // Convert ms timestamp to YYYY-MM-DD
        macd: v.value,
        signal: v.signal,
        histogram: v.histogram,
      })),
    }
  } catch (error) {
    console.error(
      `Error fetching or parsing Polygon.io MACD for ${stockTicker}:`,
      error
    )
    return null
  }
}

// --- Polygon.io Weekly Aggregates (Custom Bars) ---

/**
 * Fetches and transforms weekly stock data for a given ticker for the past N weeks.
 * Uses Polygon.io's Aggregates (Bars) API with a weekly timespan.
 * The `TransformedPolygonStockData` type is reused from the daily fetch.
 */
export async function fetchWeeklyStockData(
  apiKey: string,
  ticker: string,
  weeks: number = 10 // Default to past 10 weeks
): Promise<TransformedPolygonStockData[] | null> {
  const today = new Date()
  const fromDate = new Date()
  // Calculate the date N weeks ago. N*7 days for approximation.
  // Polygon API handles exact week boundaries based on market open/close.
  fromDate.setDate(today.getDate() - weeks * 7)

  const to = formatDate(today) // Current date
  const from = formatDate(fromDate) // N weeks ago

  const params = new URLSearchParams({
    adjusted: "true",
    sort: "desc", // Get most recent weeks first
    limit: weeks.toString(), // Limit to the number of weeks requested
    apiKey: apiKey,
  })

  // Using multiplier 1 and timespan week for weekly data
  const url = `${POLYGON_API_URL}/v2/aggs/ticker/${ticker}/range/1/week/${from}/${to}?${params.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(
        `Polygon.io API error for ${ticker} (Weekly Aggregates): ${response.status} ${response.statusText}`,
        errorData
      )
      return null
    }

    const rawData = await response.json()
    // Reusing PolygonAggregatesResponseSchema as the structure is the same
    const parsed = PolygonAggregatesResponseSchema.safeParse(rawData)

    if (!parsed.success) {
      console.error(
        `Failed to parse Polygon.io Weekly Aggregates response for ${ticker}:`,
        parsed.error.issues,
        "Raw data:",
        rawData
      )
      return null
    }

    const data = parsed.data

    if (data.status === "ERROR" || !data.results) {
      console.error(
        `Polygon.io Weekly Aggregates API returned an error for ${ticker}: ${
          data.message || data.status
        }`,
        "Full response:",
        data
      )
      return null
    }

    if (data.results.length === 0) {
      console.warn(
        `No weekly aggregate data found for ${ticker} from ${from} to ${to}. Raw response:`,
        rawData
      )
      return []
    }

    // Reusing the transformation logic, as the result structure is the same
    return data.results
      .map((agg) => ({
        date: formatDate(new Date(agg.t)),
        open: agg.o,
        high: agg.h,
        low: agg.l,
        close: agg.c,
        volume: agg.v,
        vwap: agg.vw,
        timestamp: agg.t,
        transactions: agg.n,
      }))
      .sort((a, b) => b.timestamp - a.timestamp) // Ensure descending order
  } catch (error) {
    console.error(
      `Error fetching or parsing Polygon.io Weekly Aggregates for ${ticker}:`,
      error
    )
    return null
  }
}

// --- Polygon.io RSI API ---

const PolygonRSIValueSchema = z.object({
  timestamp: z.number(), // The timestamp for the RSI data point
  value: z.number(), // The RSI value (0-100)
})

// Optional: Schema for underlying aggregate data if expand_underlying=true
const PolygonRSIUnderlyingResultSchema = z.object({
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number(),
  t: z.number(), // Timestamp
  n: z.number().optional(),
})

const PolygonRSIUnderlyingSchema = z.object({
  url: z.string().url(),
  results: z.array(PolygonRSIUnderlyingResultSchema).optional(),
})

const PolygonRSIResultsSchema = z.object({
  values: z.array(PolygonRSIValueSchema),
  underlying: PolygonRSIUnderlyingSchema.optional(), // Only if expand_underlying=true
})

const PolygonRSIResponseSchema = z.object({
  results: PolygonRSIResultsSchema.optional(),
  status: z.string().optional(),
  request_id: z.string().optional(),
  next_url: z.string().url().optional().nullable(),
  message: z.string().optional(), // Error message
})

export type TransformedPolygonRSIValue = {
  timestamp: number
  date: string // YYYY-MM-DD derived from timestamp
  rsi: number // RSI value (0-100)
}

export type TransformedPolygonRSI = {
  values: TransformedPolygonRSIValue[]
  // We can add underlying data here if needed later
}

/**
 * Fetches RSI (Relative Strength Index) data for a given ticker.
 * RSI oscillates between 0 and 100 to help identify overbought (>70) or oversold (<30) conditions.
 */
export async function fetchRSI(
  apiKey: string,
  stockTicker: string,
  params?: {
    timestamp?: string // YYYY-MM-DD or millisecond timestamp
    timespan?: "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year"
    adjusted?: boolean
    window?: number // The window size used to calculate RSI (default: 14)
    series_type?: "open" | "high" | "low" | "close" // Defaults to "close"
    expand_underlying?: boolean // Defaults to false
    order?: "asc" | "desc"
    limit?: number // Max 5000, defaults to 10
  }
): Promise<TransformedPolygonRSI | null> {
  const queryParams = new URLSearchParams({
    apiKey: apiKey,
  })

  if (params?.timestamp) queryParams.append("timestamp", params.timestamp)
  if (params?.timespan) queryParams.append("timespan", params.timespan)
  if (params?.adjusted !== undefined)
    queryParams.append("adjusted", String(params.adjusted))
  if (params?.window) queryParams.append("window", String(params.window))
  if (params?.series_type) queryParams.append("series_type", params.series_type)
  if (params?.expand_underlying !== undefined)
    queryParams.append("expand_underlying", String(params.expand_underlying))
  if (params?.order) queryParams.append("order", params.order)
  if (params?.limit) queryParams.append("limit", String(params.limit))
  else queryParams.append("limit", "50") // Default to a reasonable number like 50 if not specified

  const url = `${POLYGON_API_URL}/v1/indicators/rsi/${stockTicker}?${queryParams.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(
        `Polygon.io API error for ${stockTicker} (RSI): ${response.status} ${response.statusText}`,
        errorData
      )
      return null
    }

    const rawData = await response.json()
    const parsed = PolygonRSIResponseSchema.safeParse(rawData)

    if (!parsed.success) {
      console.error(
        `Failed to parse Polygon.io RSI response for ${stockTicker}:`,
        parsed.error.issues,
        "Raw data:",
        rawData
      )
      return null
    }

    const data = parsed.data

    if (data.status === "ERROR" || !data.results || !data.results.values) {
      console.error(
        `Polygon.io RSI API returned an error or no values for ${stockTicker}: ${
          data.message || data.status
        }`,
        "Full response:",
        data
      )
      return null
    }

    if (data.results.values.length === 0) {
      console.warn(
        `No RSI data found for ${stockTicker} from Polygon.io. Raw response:`,
        rawData
      )
      return { values: [] }
    }

    return {
      values: data.results.values.map((v) => ({
        timestamp: v.timestamp,
        date: formatDate(new Date(v.timestamp)), // Convert ms timestamp to YYYY-MM-DD
        rsi: v.value,
      })),
    }
  } catch (error) {
    console.error(
      `Error fetching or parsing Polygon.io RSI for ${stockTicker}:`,
      error
    )
    return null
  }
}

// --- Polygon.io EMA API ---

const PolygonEMAValueSchema = z.object({
  timestamp: z.number(), // The timestamp for the EMA data point
  value: z.number(), // The EMA value
})

// Optional: Schema for underlying aggregate data if expand_underlying=true
const PolygonEMAUnderlyingResultSchema = z.object({
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number(),
  t: z.number(), // Timestamp
  n: z.number().optional(),
})

const PolygonEMAUnderlyingSchema = z.object({
  url: z.string().url(),
  results: z.array(PolygonEMAUnderlyingResultSchema).optional(),
})

const PolygonEMAResultsSchema = z.object({
  values: z.array(PolygonEMAValueSchema),
  underlying: PolygonEMAUnderlyingSchema.optional(), // Only if expand_underlying=true
})

const PolygonEMAResponseSchema = z.object({
  results: PolygonEMAResultsSchema.optional(),
  status: z.string().optional(),
  request_id: z.string().optional(),
  next_url: z.string().url().optional().nullable(),
  message: z.string().optional(), // Error message
})

export type TransformedPolygonEMAValue = {
  timestamp: number
  date: string // YYYY-MM-DD derived from timestamp
  ema: number // EMA value
}

export type TransformedPolygonEMA = {
  values: TransformedPolygonEMAValue[]
  // We can add underlying data here if needed later
}

/**
 * Fetches EMA (Exponential Moving Average) data for a given ticker.
 * EMA places greater weight on recent prices, enabling quicker trend detection.
 */
export async function fetchEMA(
  apiKey: string,
  stockTicker: string,
  params?: {
    timestamp?: string // YYYY-MM-DD or millisecond timestamp
    timespan?: "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year"
    adjusted?: boolean
    window?: number // The window size used to calculate EMA (default varies)
    series_type?: "open" | "high" | "low" | "close" // Defaults to "close"
    expand_underlying?: boolean // Defaults to false
    order?: "asc" | "desc"
    limit?: number // Max 5000, defaults to 10
  }
): Promise<TransformedPolygonEMA | null> {
  const queryParams = new URLSearchParams({
    apiKey: apiKey,
  })

  if (params?.timestamp) queryParams.append("timestamp", params.timestamp)
  if (params?.timespan) queryParams.append("timespan", params.timespan)
  if (params?.adjusted !== undefined)
    queryParams.append("adjusted", String(params.adjusted))
  if (params?.window) queryParams.append("window", String(params.window))
  if (params?.series_type) queryParams.append("series_type", params.series_type)
  if (params?.expand_underlying !== undefined)
    queryParams.append("expand_underlying", String(params.expand_underlying))
  if (params?.order) queryParams.append("order", params.order)
  if (params?.limit) queryParams.append("limit", String(params.limit))
  else queryParams.append("limit", "50") // Default to a reasonable number like 50 if not specified

  const url = `${POLYGON_API_URL}/v1/indicators/ema/${stockTicker}?${queryParams.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(
        `Polygon.io API error for ${stockTicker} (EMA): ${response.status} ${response.statusText}`,
        errorData
      )
      return null
    }

    const rawData = await response.json()
    const parsed = PolygonEMAResponseSchema.safeParse(rawData)

    if (!parsed.success) {
      console.error(
        `Failed to parse Polygon.io EMA response for ${stockTicker}:`,
        parsed.error.issues,
        "Raw data:",
        rawData
      )
      return null
    }

    const data = parsed.data

    if (data.status === "ERROR" || !data.results || !data.results.values) {
      console.error(
        `Polygon.io EMA API returned an error or no values for ${stockTicker}: ${
          data.message || data.status
        }`,
        "Full response:",
        data
      )
      return null
    }

    if (data.results.values.length === 0) {
      console.warn(
        `No EMA data found for ${stockTicker} from Polygon.io. Raw response:`,
        rawData
      )
      return { values: [] }
    }

    return {
      values: data.results.values.map((v) => ({
        timestamp: v.timestamp,
        date: formatDate(new Date(v.timestamp)), // Convert ms timestamp to YYYY-MM-DD
        ema: v.value,
      })),
    }
  } catch (error) {
    console.error(
      `Error fetching or parsing Polygon.io EMA for ${stockTicker}:`,
      error
    )
    return null
  }
}

// --- Polygon.io SMA API ---

const PolygonSMAValueSchema = z.object({
  timestamp: z.number(), // The timestamp for the SMA data point
  value: z.number(), // The SMA value
})

// Optional: Schema for underlying aggregate data if expand_underlying=true
const PolygonSMAUnderlyingResultSchema = z.object({
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number(),
  t: z.number(), // Timestamp
  n: z.number().optional(),
})

const PolygonSMAUnderlyingSchema = z.object({
  url: z.string().url(),
  results: z.array(PolygonSMAUnderlyingResultSchema).optional(),
})

const PolygonSMAResultsSchema = z.object({
  values: z.array(PolygonSMAValueSchema),
  underlying: PolygonSMAUnderlyingSchema.optional(), // Only if expand_underlying=true
})

const PolygonSMAResponseSchema = z.object({
  results: PolygonSMAResultsSchema.optional(),
  status: z.string().optional(),
  request_id: z.string().optional(),
  next_url: z.string().url().optional().nullable(),
  message: z.string().optional(), // Error message
})

export type TransformedPolygonSMAValue = {
  timestamp: number
  date: string // YYYY-MM-DD derived from timestamp
  sma: number // SMA value
}

export type TransformedPolygonSMA = {
  values: TransformedPolygonSMAValue[]
  // We can add underlying data here if needed later
}

/**
 * Fetches SMA (Simple Moving Average) data for a given ticker.
 * SMA calculates the average price across a set number of periods to smooth price fluctuations.
 */
export async function fetchSMA(
  apiKey: string,
  stockTicker: string,
  params?: {
    timestamp?: string // YYYY-MM-DD or millisecond timestamp
    timespan?: "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year"
    adjusted?: boolean
    window?: number // The window size used to calculate SMA (default varies)
    series_type?: "open" | "high" | "low" | "close" // Defaults to "close"
    expand_underlying?: boolean // Defaults to false
    order?: "asc" | "desc"
    limit?: number // Max 5000, defaults to 10
  }
): Promise<TransformedPolygonSMA | null> {
  const queryParams = new URLSearchParams({
    apiKey: apiKey,
  })

  if (params?.timestamp) queryParams.append("timestamp", params.timestamp)
  if (params?.timespan) queryParams.append("timespan", params.timespan)
  if (params?.adjusted !== undefined)
    queryParams.append("adjusted", String(params.adjusted))
  if (params?.window) queryParams.append("window", String(params.window))
  if (params?.series_type) queryParams.append("series_type", params.series_type)
  if (params?.expand_underlying !== undefined)
    queryParams.append("expand_underlying", String(params.expand_underlying))
  if (params?.order) queryParams.append("order", params.order)
  if (params?.limit) queryParams.append("limit", String(params.limit))
  else queryParams.append("limit", "50") // Default to a reasonable number like 50 if not specified

  const url = `${POLYGON_API_URL}/v1/indicators/sma/${stockTicker}?${queryParams.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(
        `Polygon.io API error for ${stockTicker} (SMA): ${response.status} ${response.statusText}`,
        errorData
      )
      return null
    }

    const rawData = await response.json()
    const parsed = PolygonSMAResponseSchema.safeParse(rawData)

    if (!parsed.success) {
      console.error(
        `Failed to parse Polygon.io SMA response for ${stockTicker}:`,
        parsed.error.issues,
        "Raw data:",
        rawData
      )
      return null
    }

    const data = parsed.data

    if (data.status === "ERROR" || !data.results || !data.results.values) {
      console.error(
        `Polygon.io SMA API returned an error or no values for ${stockTicker}: ${
          data.message || data.status
        }`,
        "Full response:",
        data
      )
      return null
    }

    if (data.results.values.length === 0) {
      console.warn(
        `No SMA data found for ${stockTicker} from Polygon.io. Raw response:`,
        rawData
      )
      return { values: [] }
    }

    return {
      values: data.results.values.map((v) => ({
        timestamp: v.timestamp,
        date: formatDate(new Date(v.timestamp)), // Convert ms timestamp to YYYY-MM-DD
        sma: v.value,
      })),
    }
  } catch (error) {
    console.error(
      `Error fetching or parsing Polygon.io SMA for ${stockTicker}:`,
      error
    )
    return null
  }
}
