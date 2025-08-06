const ALLOWED_ORIGINS = [
    "https://reikem.github.io",
    "https://reikem.github.io/book-data-analizer",
    "http://localhost:5173",
  ];
  
  export function makeCorsHeaders(origin?: string | null) {
    const allowed = origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
    return {
      "Access-Control-Allow-Origin": allowed ? origin! : "https://reikem.github.io",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };
  }
  
  export function withCors(origin: string | null | undefined, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    const cors = makeCorsHeaders(origin);
    Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
    return headers;
  }
  