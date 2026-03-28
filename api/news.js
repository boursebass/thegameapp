// Vercel serverless function — proxies MLB.com RSS to avoid CORS
// GET /api/news  →  [{ title, link, date, source }]

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=300");

  try {
    const feeds = [
      { url: "https://www.mlb.com/feeds/news/rss.xml",           source: "MLB.com" },
      { url: "https://www.cbssports.com/rss/headlines/mlb/",      source: "CBS Sports" },
    ];

    const results = await Promise.allSettled(
      feeds.map(async ({ url, source }) => {
        const r = await fetch(url, {
          headers: { "User-Agent": "TheGameApp/1.0" },
          signal: AbortSignal.timeout(5000),
        });
        const xml = await r.text();
        return parseRSS(xml, source);
      })
    );

    const items = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);

    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function parseRSS(xml, source) {
  const items = [];
  const rx = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const block = m[1];
    const title = strip(extract(block, "title"));
    const link  = strip(extract(block, "link") || extract(block, "guid"));
    const date  = strip(extract(block, "pubDate"));
    if (title && link) {
      items.push({
        title,
        link,
        date: date ? new Date(date).toLocaleDateString("es-MX", { month:"short", day:"numeric", year:"numeric" }) : "",
        source,
      });
    }
  }
  return items;
}

function extract(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? (m[1] || m[2] || "") : "";
}

function strip(s) {
  return s.replace(/<[^>]+>/g, "").trim();
}
