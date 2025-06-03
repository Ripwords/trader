import { z } from "zod"
import { createEmailTemplate } from "./mail-template"

const _bodySchema = z.object({
  to: z.string().email(),
  name: z.string(),
  subject: z.string(),
  content: z.string(),
})
type TBody = z.infer<typeof _bodySchema>

export const sendEmail = async (body: TBody) => {
  const config = useRuntimeConfig()
  const { brevoKey, brevoEmail, brevoName } = config

  return await $fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": brevoKey,
    },
    body: {
      sender: {
        email: brevoEmail,
        name: brevoName,
      },
      to: [{ email: body.to, name: body.name }],
      subject: body.subject,
      htmlContent: createEmailTemplate(body.content),
    },
  })
}
