import { auth } from "~~/server/auth"

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
