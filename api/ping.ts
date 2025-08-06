import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_ORIGINS = ['https://reikem.github.io', 'http://localhost:5173']

function setCORS(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || ''
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCORS(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  return res.status(200).json({ ok: true })
}
