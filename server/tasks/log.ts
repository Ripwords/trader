export default defineTask({
  meta: {
    name: "log",
    description: "Log to the console",
  },
  async run() {
    const { alphaVantageApiKey } = useRuntimeConfig()

    return { result: "Success" }
  },
})
