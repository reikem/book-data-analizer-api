import type { VercelRequest, VercelResponse } from "@vercel/node"

const ALLOWED_ORIGINS = [
  "https://reikem.github.io",     // GH Pages (tu frontend)
  "http://localhost:5173",        // dev local
]

function setCORS(res: VercelResponse, origin?: string) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader("Access-Control-Allow-Origin", allow)
  res.setHeader("Vary", "Origin")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    setCORS(res, req.headers.origin as string | undefined)

    if (req.method === "OPTIONS") {
      return res.status(204).end()
    }
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" })
    }

    const hasKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim())
    return res.status(200).json({
      ok: true,
      openaiKey: hasKey,                       // true/false (no expone la key)
      env: process.env.VERCEL_ENV || "unknown",
      region: process.env.VERCEL_REGION || "unknown",
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Internal Error" })
  }
}
