import { applyCORS } from "./_cors"

type AskBody = {
  question?: string
  data?: any[]
  companies?: string[]
}

export default async function handler(req: any, res: any) {
  if (applyCORS(req, res)) return
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" })

  const key = process.env.OPENAI_API_KEY
  if (!key) return res.status(401).json({ error: "Missing OPENAI_API_KEY" })

  try {
    const body: AskBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const question = (body?.question || "").toString().slice(0, 2000)

    // Envía sólo una muestra acotada
    const sample = Array.isArray(body?.data) ? body!.data.slice(0, 120) : []

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "Eres analista financiero. Responde en español, breve y accionable." },
          {
            role: "user",
            content:
              `Pregunta: ${question}\n` +
              `Sociedades: ${Array.isArray(body?.companies) ? body!.companies.join(", ") : "todas"}\n` +
              `Muestra de datos (truncado): ${JSON.stringify(sample)}`,
          },
        ],
      }),
    })

    const text = await r.text()
    if (!r.ok) {
      // Propaga errores útiles (401, 429, etc.) para que el front muestre un aviso
      return res.status(r.status).json({ error: text })
    }
    const json = JSON.parse(text)
    const answer = json?.choices?.[0]?.message?.content ?? "Sin respuesta."
    res.status(200).json({ answer, via: "remote" })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Error" })
  }
}
