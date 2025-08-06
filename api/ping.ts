import { applyCORS } from "./_cors"

export default async function handler(req: any, res: any) {
  if (applyCORS(req, res)) return
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" })
  res.status(200).json({ ok: true, env: !!process.env.OPENAI_API_KEY })
}
