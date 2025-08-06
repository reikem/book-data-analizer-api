const ALLOWED_ORIGINS = [
  "https://reikem.github.io",
  "https://reikem.github.io/book-data-analizer",
  "http://localhost:5173",
];

export function applyCors(req: any, res: any) {
  const origin = req.headers.origin || "";
  const allow = ALLOWED_ORIGINS.find((o) => origin?.startsWith(o)) || "*";

  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}
