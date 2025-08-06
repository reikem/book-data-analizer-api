export const config = { runtime: "nodejs" }

const ALLOWED = ["https://reikem.github.io", "http://localhost:5173"]

function cors(res: Response, reqOrigin?: string) {
  const origin = reqOrigin && ALLOWED.includes(reqOrigin) ? reqOrigin : "*"
  res.headers.set("Access-Control-Allow-Origin", origin)
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type")
  return res
}

export default async function handler(req: Request) {
  const origin = req.headers.get("Origin") || undefined
  if (req.method === "OPTIONS") return cors(new Response(null, { status: 204 }), origin)
  if (req.method !== "POST") return cors(new Response("Method Not Allowed", { status: 405 }), origin)

  try {
    const { question, data } = await req.json()
    const key = (process.env.OPENAI_API_KEY || "").trim()
    if (!key) {
      return cors(
        new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
        origin,
      )
    }

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
      // Propaga código y detalle; útil para ver 401/invalid_api_key
      return cors(new Response(JSON.stringify({ error: text }), { status: r.status, headers: { "Content-Type": "application/json" } }), origin)
    }

    const j = JSON.parse(text)
    const answer = j?.choices?.[0]?.message?.content ?? "Sin respuesta."
    return cors(new Response(JSON.stringify({ answer }), { status: 200, headers: { "Content-Type": "application/json" } }), origin)
  } catch (e: any) {
    return cors(new Response(JSON.stringify({ error: e?.message ?? "Error" }), { status: 500, headers: { "Content-Type": "application/json" } }), origin)
  }
}
