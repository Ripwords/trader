<script setup lang="ts">
import { useRoute } from "vue-router"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Button } from "~/components/ui/button"

useSeoMeta({
  title: "Ticker",
  description: "Track your favorite ticker",
})

const route = useRoute("tickers-id")
const currentTickerId = String(route.params.id || "")

const { data: tickerData, pending } = useFetch(
  `/api/finance/${currentTickerId}`,
  {
    query: {
      riskAppetite: "medium",
    },
    retryDelay: 3500,
    retry: 5,
  }
)

const getRecommendationClass = (action?: string): string => {
  if (!action) return ""
  const actionUpper = action.toUpperCase()
  if (actionUpper === "BUY") return "text-green-500 font-bold"
  if (actionUpper === "SELL") return "text-red-500 font-bold"
  if (actionUpper === "HOLD") return "text-yellow-500 font-bold"
  return ""
}
</script>

<template>
  <div class="container mx-auto p-4">
    <div>
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-3xl font-bold">{{ currentTickerId }}</h1>
        <NuxtLink to="/tickers">
          <Button variant="outline">Back to Tickers</Button>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 class="text-xl font-semibold mb-2">TradingView Chart</h2>
          <MiniChart
            :key="currentTickerId + $colorMode.value"
            :options="{
              symbol: currentTickerId,
              width: '100%',
              isTransparent: false,
              colorTheme: $colorMode.value,
              locale: 'en',
            }"
          />
          <TechnicalAnalysis
            :key="currentTickerId + $colorMode.value"
            :options="{
              width: '100%',
              height: 450,
              colorTheme: $colorMode.value,
              interval: '1m',
              isTransparent: false,
              symbol: currentTickerId,
              showIntervalTabs: true,
              displayMode: 'single',
              locale: 'en',
            }"
          />
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Latest Recommendation</h2>
          <div
            v-if="pending"
            class="text-center"
          >
            <p>Loading ticker details...</p>
          </div>
          <div
            v-else-if="tickerData?.errors"
            class="text-center text-red-500"
          >
            <p>
              Error loading ticker details:
              {{ tickerData?.errors || "Failed to load data" }}
            </p>
            <NuxtLink to="/tickers">
              <Button variant="link">Back to Tickers</Button>
            </NuxtLink>
          </div>
          <Card
            v-else-if="!tickerData?.errors && tickerData?.data"
            class="mt-4"
          >
            <CardHeader>
              <CardTitle
                :class="
                  getRecommendationClass(
                    tickerData.data.recommendation.recommendation
                  )
                "
              >
                {{ tickerData.data.recommendation.recommendation }}
              </CardTitle>
              <CardDescription>
                Risk Appetite: {{ tickerData.data.riskAppetite }}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                {{ tickerData.data.recommendation.justification }}
              </p>
            </CardContent>
            <CardFooter>
              <p class="text-xs text-muted-foreground">
                Generated on:
                {{ $dayjs(tickerData.data.createdAt).format("MM/DD/YYYY") }}
              </p>
            </CardFooter>
          </Card>
          <div v-else>
            <p>No recommendation available for this ticker yet.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
