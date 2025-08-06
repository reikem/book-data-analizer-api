export const config = { runtime: "nodejs" }

const ALLOWED = ["https://reikem.github.io", "http://localhost:5173"]

function cors(res: Response, reqOrigin?: string) {
  const origin = reqOrigin && ALLOWED.includes(reqOrigin) ? reqOrigin : "*"
  res.headers.set("Access-Control-Allow-Origin", origin)
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type")
  return res
}

export default function handler(req: Request) {
  if (req.method === "OPTIONS") return cors(new Response(null, { status: 204 }), req.headers.get("Origin"))

  const hasKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim())
  const body = JSON.stringify({
    ok: true,
    openaiKey: hasKey,            // true/false, no expone la key
    env: process.env.VERCEL_ENV || "unknown",
    region: process.env.VERCEL_REGION || "unknown",
  })
  return cors(new Response(body, { status: 200, headers: { "Content-Type": "application/json" } }), req.headers.get("Origin"))
}
