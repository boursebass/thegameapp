// Vercel serverless function — proxies Claude API to keep key server-side
// POST /api/analyze  { prompt, maxTokens?, stream? }

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500 });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { prompt, maxTokens = 2000, stream = false } = body;
  if (!prompt) {
    return new Response(JSON.stringify({ error: "prompt required" }), { status: 400 });
  }

  const payload = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    stream,
    messages: [{ role: "user", content: prompt }],
  };

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": stream ? "text/event-stream" : "application/json",
  };

  return new Response(upstream.body, { status: upstream.status, headers });
}
