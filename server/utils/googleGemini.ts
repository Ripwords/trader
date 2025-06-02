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
- Key technical indicators like MACD (Moving Average Convergence/Divergence)
- Short interest data

**Analysis Framework (Based on Available Data):**
1. **Price Action Analysis:** Compare recent daily vs weekly trends, volume patterns
2. **Volume Conviction:** Assess if volume supports price movements or suggests weak participation
3. **Technical Indicators:** Analyze MACD values (MACD line, signal line, histogram) for momentum and potential signals
4. **Short Interest:** Evaluate short interest data for signs of bearish sentiment or potential short squeeze scenarios
5. **News Sentiment Quality:** Evaluate sentiment scores, source credibility, and ticker relevance from the separate news summary
6. **Data Limitations:** Acknowledge what you cannot determine from limited data points
7. **Risk Assessment:** Identify risks given the data constraints

**Critical Evaluation Points:**
- Are price movements supported by volume?
- Do sentiment scores align with actual price action and technical indicators?
- How reliable are the news sources and sentiment calculations?
- What key information is missing that could change the analysis (e.g., broader market context, full financial statements)?
- Is the recent price action sustainable based on available evidence (price, volume, MACD, short interest)?

**Input Data:**
- News Summary (separate from stock data): ${newsSummary}
- Risk Appetite: ${riskAppetite}
- Stock Data Summary (JSON string): ${stockDataSummary}

**Instructions:**
- Work only with the provided data points - no external knowledge
- Be explicit about data limitations and their impact on confidence
- Focus on what can be reasonably concluded from limited price history, sentiment, MACD, and short interest
- Avoid overconfident predictions based on insufficient data
- Consider that your analysis is a snapshot with limited historical context

${
  comprehensive
    ? `
**Comprehensive Analysis Mode:**
Provide additional deep-dive analysis including:
- Historical context and pattern comparison (if data allows)
- Cross-validation of different data points (daily/weekly price, volume, MACD, short interest, news)
- Scenario analysis with best/worst/likely outcomes based on the provided data
- Brief commentary on how short interest and MACD might influence potential price movements
`
    : ""
}

Return your answer in JSON format like this:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence_level": "Low|Medium|High",
  "justification": "2-3 sentence analysis referencing specific data points (price levels, volume changes, MACD signals, short interest levels, sentiment scores)",
  "key_risks": "2-3 main risks given data limitations and market conditions reflected in the data",
  "data_limitations": "What critical information is missing that affects confidence",
  "sentiment_analysis": "Brief assessment of news sentiment quality and reliability based on the news summary provided",
  "technical_snapshot": "Brief summary of MACD and short interest interpretation (e.g., MACD bullish crossover, high short interest indicating bearish sentiment or squeeze potential)"
}

Do not include any other text or comments or formatting, such that it can be parsed as JSON.
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
