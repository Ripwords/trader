<script setup lang="ts">
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ref } from "vue"
import { toast } from "vue-sonner"
import type { InternalApi } from "nitropack"

useSeoMeta({
  title: "Tickers",
  description: "Track your favorite tickers",
})

const {
  data: tickers,
  pending,
  error,
  refresh: refreshTickers,
} = await useLazyFetch("/api/user/list")

type TickerItem = InternalApi["/api/user/list"]["get"][number]

const searchTerm = useState("searchTerm", () => "")
const searchResults = useState<TickerItem[] | null>("searchResults", () => null) // Holds the entire API response
const isLoadingSearch = useState("isLoadingSearch", () => false)
const selectedTicker = useState<TickerItem | null>("selectedTicker", () => null) // Holds a single selected ticker item
const isAddingTicker = useState("isAddingTicker", () => false)
const tickerToDeleteId = ref<number | null>(null) // Changed to number
const isDeletingTicker = ref(false)

const searchTickers = useDebounceFn(async () => {
  if (searchTerm.value.length < 2) {
    searchResults.value = null
    return
  }
  isLoadingSearch.value = true
  try {
    const data = await $fetch<TickerItem[]>(
      `https://ticker-2e1ica8b9.now.sh/keyword/${searchTerm.value}`
    )
    searchResults.value = data
  } catch (err) {
    if (err instanceof Error) {
      toast.error(err.message)
    } else {
      toast.error("Failed to search tickers.")
    }
    searchResults.value = null
  } finally {
    isLoadingSearch.value = false
  }
}, 1000)

watch(searchTerm, searchTickers)

async function addTicker(ticker: TickerItem) {
  if (!ticker || !ticker.symbol) {
    toast.error("Invalid ticker selected")
    return
  }
  isLoadingSearch.value = false
  isAddingTicker.value = true
  selectedTicker.value = ticker
  try {
    await $fetch("/api/user/add", {
      method: "POST",
      body: { symbol: ticker.symbol },
    })
    await refreshTickers()
    toast.success(`Ticker ${ticker.symbol} added successfully!`)
    searchTerm.value = ""
    searchResults.value = null
  } catch (error: unknown) {
    if (error instanceof Error) {
      toast.error(error.message)
    } else {
      toast.error("Failed to add ticker.")
    }
  } finally {
    isAddingTicker.value = false
  }
}

async function handleDeleteTicker() {
  if (tickerToDeleteId.value === null) return
  const tickerSymbolToDelete = tickers.value?.find(
    (t) => t.id === tickerToDeleteId.value
  )?.symbol
  isDeletingTicker.value = true
  try {
    await $fetch(`/api/user/${tickerSymbolToDelete}`, {
      method: "DELETE",
    })
    await refreshTickers()
    toast.success(`Ticker ${tickerSymbolToDelete || ""} deleted successfully!`)
    tickerToDeleteId.value = null
  } catch (error: unknown) {
    if (error instanceof Error) {
      toast.error(error.message)
    } else {
      toast.error("Failed to delete ticker.")
    }
  } finally {
    isDeletingTicker.value = false
  }
}
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">My Tracked Tickers</h1>
      <Dialog v-model:open="isAddingTicker">
        <DialogTrigger as-child>
          <Button>Add Ticker</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Ticker</DialogTitle>
            <DialogDescription>
              Search for a stock ticker to add to your tracking list.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <Input
              v-model="searchTerm"
              placeholder="Search for a ticker (e.g., AAPL)"
              @focus="searchResults = null"
            />
            <div
              v-if="isLoadingSearch"
              class="text-center"
            >
              Searching...
            </div>
            <ul
              v-else-if="searchResults && searchResults.length > 0"
              class="max-h-60 overflow-y-auto border rounded-md"
            >
              <li
                v-for="resultItem in searchResults"
                :key="resultItem.symbol"
                class="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
              >
                <span>{{ resultItem.symbol }} - {{ resultItem.name }}</span>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="
                    isAddingTicker &&
                    selectedTicker?.symbol === resultItem.symbol
                  "
                  @click.stop="addTicker(resultItem)"
                >
                  {{
                    isAddingTicker &&
                    selectedTicker?.symbol === resultItem.symbol
                      ? "Adding..."
                      : "Add"
                  }}
                </Button>
              </li>
            </ul>
            <p
              v-else-if="
                searchTerm.length >= 2 &&
                !isLoadingSearch &&
                (!searchResults || searchResults.length === 0)
              "
            >
              No results found for "{{ searchTerm }}".
            </p>
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button
                type="button"
                variant="outline"
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    <div
      v-if="pending"
      class="text-center"
    >
      <p>Loading tickers...</p>
    </div>
    <div
      v-else-if="error"
      class="text-center text-red-500"
    >
      <p>Error loading tickers: {{ error.message }}</p>
    </div>
    <div
      v-else-if="tickers && tickers.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <Card
        v-for="ticker in tickers"
        :key="ticker.id"
      >
        <CardHeader>
          <CardTitle>
            <div class="flex justify-between items-center">
              <NuxtLink :to="`/tickers/${ticker.symbol}`">
                <p>{{ ticker.symbol }}</p>
              </NuxtLink>
              <Dialog>
                <DialogTrigger as-child>
                  <Button
                    variant="ghost"
                    @click="tickerToDeleteId = Number(ticker.id)"
                  >
                    <Icon name="line-md:remove" />
                  </Button>
                </DialogTrigger>
                <DialogContent class="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this ticker ({{
                        ticker.symbol
                      }})? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter class="sm:justify-start">
                    <DialogClose as-child>
                      <Button
                        type="button"
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      variant="destructive"
                      :disabled="isDeletingTicker"
                      @click="handleDeleteTicker"
                    >
                      {{ isDeletingTicker ? "Deleting..." : "Delete" }}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniChart
            :key="ticker.symbol + $colorMode.value"
            :class="ticker.symbol"
            :options="{
              symbol: ticker.symbol,
              width: '100%',
              isTransparent: false,
              colorTheme: $colorMode.value,
              locale: 'en',
            }"
          />
        </CardContent>
        <CardFooter class="flex justify-between items-center">
          <NuxtLink :to="`/tickers/${ticker.symbol}`">
            <Button variant="outline">View Details</Button>
          </NuxtLink>
        </CardFooter>
      </Card>
    </div>
    <div
      v-else
      class="text-center"
    >
      <p>You are not tracking any tickers yet.</p>
    </div>
  </div>
</template>
