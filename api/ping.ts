import { withCors } from "./_cors";
export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: withCors(origin) });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: withCors(origin, { "Content-Type": "application/json" }),
  });
}
