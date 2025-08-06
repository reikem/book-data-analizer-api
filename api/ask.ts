
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "./_cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { question, data, companies } = req.body || {};
    if (!process.env.OPENAI_API_KEY) {
      return res.status(401).json({ error: "Missing OPENAI_API_KEY" });
    }
    if (!question) {
      return res.status(400).json({ error: "Missing 'question'" });
    }

    const sample = Array.isArray(data) ? data.slice(0, 200) : [];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "Eres analista financiero. Responde claro y en español." },
          {
            role: "user",
            content:
              `Pregunta: ${question}\n` +
              `Sociedades: ${companies?.join(", ") ?? "todas"}\n` +
              `Muestra: ${JSON.stringify(sample)}`,
          },
        ],
      }),
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(r.status).json({ error: text });
    }
    const j = JSON.parse(text);
    const answer = j?.choices?.[0]?.message?.content ?? "Sin respuesta.";
    return res.status(200).json({ answer, via: "remote" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
}
