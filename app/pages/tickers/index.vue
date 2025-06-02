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

// Interface for an individual ticker item from search
interface TickerItem {
  symbol: string
  name: string
}

// Interface for the items in the user's tracked tickers list
interface UserTickerInfo {
  id: number // Assuming id from the database is a number
  symbol: string
  userId: string
  createdAt: string // Or Date, depending on what the API returns
  updatedAt: string // Or Date
  // Add other properties if needed, e.g., recommendation type
}

const {
  data: tickers,
  pending,
  error,
  refresh: refreshTickers,
} = await useLazyFetch<UserTickerInfo[]>("/api/user/list")

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
    console.error("Error searching tickers:", err)
    toast.error("Failed to search tickers.")
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
    console.error("Error adding ticker:", error)
    let errorMessage = "Failed to add ticker."
    if (typeof error === "object" && error !== null && "data" in error) {
      const errorData = (error as { data: { message?: string } }).data
      if (errorData && typeof errorData.message === "string") {
        errorMessage = errorData.message
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    toast.error(errorMessage)
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
    console.error("Error deleting ticker:", error)
    let errorMessage = "Failed to delete ticker."
    if (typeof error === "object" && error !== null && "data" in error) {
      const errorData = (error as { data: { message?: string } }).data
      if (errorData && typeof errorData.message === "string") {
        errorMessage = errorData.message
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    toast.error(errorMessage)
  } finally {
    isDeletingTicker.value = false
  }
}
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">My Tracked Tickers</h1>
      <Dialog>
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
          <CardTitle>{{ ticker.symbol }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Tracked since: {{ $dayjs(ticker.createdAt).format("MM/DD/YYYY") }}
          </p>
        </CardContent>
        <CardFooter class="flex justify-between items-center">
          <NuxtLink :to="`/tickers/${ticker.symbol}`">
            <Button variant="outline">View Details</Button>
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
