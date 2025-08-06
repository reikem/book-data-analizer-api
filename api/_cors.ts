const ALLOWED = new Set([
  "http://localhost:5173",
  "https://reikem.github.io",
  "https://reikem.github.io/book-data-analizer",
])

export function applyCORS(req: any, res: any) {
  const origin = req.headers.origin || ""
  const allow = ALLOWED.has(origin) ? origin : "https://reikem.github.io"

  res.setHeader("Access-Control-Allow-Origin", allow)
  res.setHeader("Vary", "Origin")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    res.status(204).end()
    return true 
  return false
}
}