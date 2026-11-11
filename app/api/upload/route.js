import { db } from "@/lib/db";

const MAX = 4 * 1024 * 1024;
const OK = /^(image\/(png|jpe?g|gif|webp)|video\/(mp4|webm|quicktime))$/;

export async function POST(req) {
  const mime = (req.headers.get("content-type") || "").split(";")[0];
  if (!OK.test(mime)) return Response.json({ error: "Só imagens (png, jpg, gif, webp) e vídeos (mp4, webm, mov)" }, { status: 400 });
  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return Response.json({ error: "Arquivo vazio" }, { status: 400 });
  if (buf.length > MAX) return Response.json({ error: "Arquivo maior que 4 MB" }, { status: 413 });
  const pool = await db();
  const [r] = await pool.query("INSERT INTO files (mime, data) VALUES (?, ?)", [mime, buf]);
  return Response.json({ id: r.insertId, mime });
}
