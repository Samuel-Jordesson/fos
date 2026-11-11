import dns from "node:dns/promises";
import net from "node:net";

const cache = globalThis._previewCache || (globalThis._previewCache = new Map());

function isPrivate(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const l = ip.toLowerCase();
  return l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") || l.startsWith("::ffff:");
}

const meta = (html, ...keys) => {
  for (const k of keys) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*>`, "i");
    const tag = html.match(re)?.[0];
    const v = tag?.match(/content=["']([^"']*)["']/i)?.[1];
    if (v) return v.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  }
  return null;
};

export async function GET(req) {
  const raw = new URL(req.url).searchParams.get("url") || "";
  if (cache.has(raw)) return Response.json(cache.get(raw));
  let u;
  try { u = new URL(raw); } catch { return Response.json({}, { status: 400 }); }
  if (!/^https?:$/.test(u.protocol)) return Response.json({}, { status: 400 });
  try {
    const { address } = await dns.lookup(u.hostname);
    if (isPrivate(address)) return Response.json({}, { status: 400 });
    const res = await fetch(u, { redirect: "follow", signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Mozilla/5.0 (compatible; ForumPreview/1.0)" } });
    if (!(res.headers.get("content-type") || "").includes("html")) return Response.json({});
    const html = (await res.text()).slice(0, 300000);
    let image = meta(html, "og:image", "twitter:image");
    if (image) try { image = new URL(image, res.url).href; } catch { image = null; }
    const data = {
      title: meta(html, "og:title", "twitter:title") || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || null,
      description: meta(html, "og:description", "description", "twitter:description"),
      image, site: meta(html, "og:site_name") || u.hostname.replace(/^www\./, ""),
    };
    if (cache.size > 500) cache.clear();
    cache.set(raw, data);
    return Response.json(data);
  } catch { return Response.json({}); }
}
