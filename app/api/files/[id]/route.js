import { db } from "@/lib/db";

export async function GET(req, { params }) {
  const { id } = await params;
  const pool = await db();
  const [rows] = await pool.query("SELECT mime, data FROM files WHERE id = ?", [id]);
  if (!rows.length) return new Response("Não encontrado", { status: 404 });
  const { mime, data } = rows[0];
  const total = data.length;
  const headers = { "Content-Type": mime, "Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes" };
  // suporte a Range (necessário pro Safari tocar vídeo)
  const range = req.headers.get("range");
  const m = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (m) {
    const start = m[1] ? Number(m[1]) : 0;
    const end = m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
    return new Response(data.subarray(start, end + 1), {
      status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(data, { headers: { ...headers, "Content-Length": String(total) } });
}
