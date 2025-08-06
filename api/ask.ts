import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_ORIGINS = [
  'https://reikem.github.io',
  'http://localhost:5173',
]

function setCORS(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || ''
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORS(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' })
  }

  try {
    const { question, data = [], companies = [] } = req.body || {}
    const sample = Array.isArray(data) ? data.slice(0, 200) : []

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'Eres analista financiero. Responde claro y en español.' },
          {
            role: 'user',
            content:
              `Pregunta: ${question}\n` +
              `Sociedades: ${companies?.join(', ') || 'todas'}\n` +
              `Muestra: ${JSON.stringify(sample)}`,
          },
        ],
      }),
    })

    if (!r.ok) {
      const t = await r.text()
      // Propaga 401 si OpenAI devolvió 401 (clave inválida)
      return res.status(r.status === 401 ? 401 : 500).json({ error: t })
    }

    const j = await r.json()
    const answer = j?.choices?.[0]?.message?.content ?? 'Sin respuesta.'
    return res.json({ answer })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? 'Error' })
  }
}