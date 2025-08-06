import type { VercelRequest, VercelResponse } from "@vercel/node"

const ALLOWED_ORIGINS = [
  "https://reikem.github.io",
  "http://localhost:5173",
]

function setCORS(res: VercelResponse, origin?: string) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader("Access-Control-Allow-Origin", allow)
  res.setHeader("Vary", "Origin")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    setCORS(res, req.headers.origin as string | undefined)

    if (req.method === "OPTIONS") {
      return res.status(204).end()
    }
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" })
    }

    const key = (process.env.OPENAI_API_KEY || "").trim()
    if (!key) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" })
    }

    const { question, data } = req.body || {}
    const sample = Array.isArray(data) ? data.slice(0, 200) : []

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: "Eres analista financiero y respondes en español, claro y conciso." },
          {
            role: "user",
            content: `Pregunta: ${question}\nMuestra (máx 200 filas): ${JSON.stringify(sample)}`,
          },
        ],
      }),
    })

    const text = await r.text()
    if (!r.ok) {
      // Propaga el código y detalle (útil para 401/invalid_api_key)
      return res.status(r.status).json({ error: text })
    }

    const j = JSON.parse(text)
    const answer = j?.choices?.[0]?.message?.content ?? "Sin respuesta."
    return res.status(200).json({ answer })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Internal Error" })
  }
}
