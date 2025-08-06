import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "./_cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  return res.status(200).json({ ok: true });
}
