import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { canAccess, likerOf } from "@/lib/rooms";

// curtir / descurtir
export async function POST(req, { params }) {
  const { id } = await params;
  const { guestName } = await req.json().catch(() => ({}));
  const user = await getUser();
  if (!user && !String(guestName || "").trim()) return Response.json({ error: "Sem nome" }, { status: 400 });
  const pool = await db();
  const [[row]] = await pool.query("SELECT r.* FROM messages m JOIN rooms r ON r.id = m.room_id WHERE m.id = ?", [id]);
  if (!row) return Response.json({ error: "Mensagem não existe" }, { status: 404 });
  if (!canAccess(row, user, req.headers.get("x-room-key"))) return Response.json({ error: "Sem acesso a esta sala" }, { status: 403 });
  const liker = likerOf(user, guestName);
  const [d] = await pool.query("DELETE FROM message_likes WHERE message_id = ? AND liker = ?", [id, liker]);
  if (!d.affectedRows) await pool.query("INSERT IGNORE INTO message_likes (message_id, liker) VALUES (?, ?)", [id, liker]);
  const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM message_likes WHERE message_id = ?", [id]);
  return Response.json({ n: Number(n), mine: !d.affectedRows });
}
