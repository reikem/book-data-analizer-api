// /api/ask.ts (Vercel)
export const config = { runtime: "edge" }

const ALLOWED = [
  "https://reikem.github.io",
  "https://reikem.github.io/book-data-analizer",
  "http://localhost:5173",
]

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED.some((o) => origin.startsWith(o)) ? origin : ALLOWED[0]
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}

export default async function handler(req: Request) {
  const origin = req.headers.get("origin")

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) })
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "API OK" }), {
      headers: { "content-type": "application/json", ...corsHeaders(origin) },
    })
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders(origin) })
  }

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders(origin) },
    })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json", ...corsHeaders(origin) },
    })
  }

  const question = body?.question ?? ""
  const data = Array.isArray(body?.data) ? body.data : []

  // ⬇️ sample chico y con pocos campos
  const sample = data.slice(0, 50).map((r: any) => ({
    SociedadNombre: r.SociedadNombre,
    SociedadCodigo: r.SociedadCodigo,
    MontoEstandarizado: r.MontoEstandarizado,
    Mes: r.Mes ?? r.mes,
    LibroMayor: r.LibroMayor,
  }))

  // Llamada a OpenAI
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Eres analista financiero. Responde claro y en español." },
        {
          role: "user",
          content:
            `Pregunta: ${question}\n` +
            `Muestra de datos (máx 50):\n` +
            JSON.stringify(sample, null, 2),
        },
      ],
    }),
  })

  if (!r.ok) {
    const txt = await r.text().catch(() => "")
    return new Response(JSON.stringify({ error: txt || `HTTP ${r.status}` }), {
      status: r.status,
      headers: { "content-type": "application/json", ...corsHeaders(origin) },
    })
  }

  const j = await r.json().catch(() => ({}))
  const answer = j?.choices?.[0]?.message?.content ?? "Sin respuesta."

  return new Response(JSON.stringify({ answer }), {
    headers: { "content-type": "application/json", ...corsHeaders(origin) },
  })
}
