import { GoogleGenAI } from "@google/genai"

export interface GeminiRecommendation {
  recommendation: "BUY" | "SELL" | "HOLD"
  confidence_level: "Low" | "Medium" | "High"
  justification: string
  key_risks: string
  data_limitations: string
  sentiment_analysis: string
  technical_snapshot: string
  error?: string
}

export const getInvestmentRecommendation = async (
  newsSummary: string,
  riskAppetite: string,
  stockDataSummary: string,
  comprehensive: boolean = false
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.NUXT_GEMINI_API_KEY })

  try {
    const prompt = `
**Role:** You are a rigorous financial analyst specializing in short-term technical and sentiment analysis. Your task is to provide a BUY, SELL, or HOLD recommendation based EXCLUSIVELY on the limited data provided. Apply critical evaluation within the constraints of available information.

**Available Data Analysis:**
You have access to a JSON string containing:
- Limited daily price data (OHLCV)
- Limited weekly price data (OHLCV)
- Recent news sentiment scores and source analysis (provided in a separate summary)
- User's stated risk appetite
- Key technical indicators: MACD, RSI, SMA (Simple Moving Average), EMA (Exponential Moving Average)
- Short interest data

**Analysis Framework (Based on Available Data):**
1. **Price Action Analysis:** Compare recent daily vs weekly trends, identify momentum shifts, support/resistance behavior, and volume spikes
2. **Volume Conviction:** Assess if volume validates price movement or signals weak participation/exhaustion
3. **Technical Indicators:**
   - **MACD**: Interpret crossover signals, histogram divergence, and momentum
   - **RSI**: Identify overbought/oversold zones and trend strength
   - **SMA/EMA**: Assess short vs long-term trend alignment and crossover patterns
4. **Short Interest:** Evaluate short interest as a bearish indicator or a potential short squeeze setup
5. **News Sentiment Quality:** Assess sentiment scores, ticker relevance, and source credibility from the provided summary
6. **Data Limitations:** Clearly outline missing data and how it affects decision-making confidence
7. **Risk Assessment:** Identify key risks given current data and user's stated risk appetite

**Critical Evaluation Points:**
- Are price movements supported or contradicted by volume?
- Do MACD, RSI, SMA/EMA agree with each other and with price action?
- Do sentiment scores align with technical indicators and price behavior?
- Are the sentiment sources credible and relevant?
- What critical context is missing (e.g., macroeconomic data, earnings reports)?
- Is the price trend sustainable based on technical signals, sentiment, and participation?

**Input Data:**
- News Summary (separate from stock data): ${newsSummary}
- Risk Appetite: ${riskAppetite}
- Stock Data Summary (JSON string): ${stockDataSummary}

**Instructions:**
- Work only with the provided data points - no external knowledge or extrapolation
- Be explicit about data limitations and their impact on confidence
- Avoid overconfident predictions based on insufficient data
- Provide a recommendation that reflects short-term conditions and risk alignment

${
  comprehensive
    ? `
**Comprehensive Analysis Mode:**
Provide additional deep-dive analysis including:
- Historical pattern comparison (if data allows)
- Cross-validation between all indicators and sentiment
- Scenario analysis: best/worst/likely outcomes
- Commentary on how MACD, RSI, SMA/EMA, and short interest might influence upcoming price action
`
    : ""
}

Return your answer in JSON format like this:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence_level": "Low|Medium|High",
  "justification": "2-3 sentence analysis referencing specific data points (e.g. MACD crossover, RSI nearing 70, volume spike on daily chart, short interest up X%, positive sentiment from top-tier sources)",
  "key_risks": "2-3 main risks given data limitations and observed market signals",
  "data_limitations": "What critical information is missing that affects confidence",
  "sentiment_analysis": "Brief assessment of news sentiment quality and reliability based on the news summary provided",
  "technical_snapshot": "Summary of MACD, RSI, SMA/EMA, and short interest interpretation (e.g., MACD bullish crossover, RSI 68 - approaching overbought, 50/200 SMA bullish alignment, short interest elevated)"
}

Do not include any other text or formatting.
`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents: prompt,
    })

    const text = response?.text?.replace(/^```json\n/, "").replace(/\n```$/, "")

    return JSON.parse(text || "{}") as GeminiRecommendation
  } catch (error) {
    console.error("Error getting investment recommendation:", error)
    return undefined
  }
}
