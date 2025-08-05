
export const config = { runtime: "edge" }

const ALLOWED_ORIGINS = [
  "https://reikem.github.io",
  "https://reikem.github.io/book-data-analizer"
]

function corsHeaders(origin?: string) {
  const allow = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o))
  return {
    "Access-Control-Allow-Origin": allow ? origin : "https://reikem.github.io",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  }
}

export default async function handler(req: Request) {
  const origin = req.headers.get("origin") || undefined

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) })
  }
  if (req.method === "GET") {
    return new Response("API OK", { headers: corsHeaders(origin) })
  }
  if (req.method !== "POST") {
    return new Response("Not Found", { status: 404, headers: corsHeaders(origin) })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Falta OPENAI_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    })
  }

  try {
    const { question, data } = await req.json()
    const sample = Array.isArray(data) ? data.slice(0, 200) : []

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "Eres analista financiero. Responde claro y en español." },
          { role: "user", content: `Pregunta: ${question}\nMuestra: ${JSON.stringify(sample)}` },
        ],
      }),
    })

    if (!r.ok) {
      const t = await r.text()
      return new Response(JSON.stringify({ error: t }), {
        status: r.status,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      })
    }

    const j = await r.json()
    const answer = j?.choices?.[0]?.message?.content ?? "Sin respuesta."
    return new Response(JSON.stringify({ answer }), {
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    })
  }
}
