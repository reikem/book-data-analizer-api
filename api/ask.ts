export const config = { runtime: "edge" }

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405 })
  }

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 })
  }

  const { question, data, companies } = await req.json().catch(() => ({}))
  const sample = Array.isArray(data) ? data.slice(0, 200) : []

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
        { role: "system", content: "Eres analista financiero. Responde claro y en español." },
        { role: "user", content:
          `Pregunta: ${question}\nSociedades: ${companies?.join(", ") ?? "todas"}\nMuestra: ${JSON.stringify(sample)}`
        },
      ],
    }),
  })

  if (!r.ok) {
    const t = await r.text()
    return new Response(JSON.stringify({ error: t }), { status: r.status })
  }
  const j = await r.json()
  const answer = j?.choices?.[0]?.message?.content ?? "Sin respuesta."
  return new Response(JSON.stringify({ answer, via: "remote" }), { status: 200 })
}
