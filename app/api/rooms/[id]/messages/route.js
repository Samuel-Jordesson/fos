import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { canAccess, likerOf } from "@/lib/rooms";
import { callStatus } from "@/lib/call";

async function guard(pool, id, req, user) {
  const [rows] = await pool.query("SELECT * FROM rooms WHERE id = ?", [id]);
  if (!rows.length) return Response.json({ error: "Sala não existe" }, { status: 404 });
  if (!canAccess(rows[0], user, req.headers.get("x-room-key"))) return Response.json({ error: "Sem acesso a esta sala" }, { status: 403 });
  return null;
}
export const dynamic = "force-dynamic";

const COLS = `m.id, m.author, m.user_id, m.body, m.file_id, m.file_mime, m.call_kind, m.call_ended_at, m.created_at, m.reply_to,
  r.author AS reply_author, LEFT(r.body, 140) AS reply_body, r.file_mime AS reply_file`;
const FROM = "FROM messages m LEFT JOIN messages r ON r.id = m.reply_to";

export async function GET(req, { params }) {
  const { id } = await params;
  const after = Number(new URL(req.url).searchParams.get("after") || 0);
  const pool = await db();
  const user = await getUser();
  const denied = await guard(pool, id, req, user);
  if (denied) return denied;
  const [rows] = await pool.query(
    after
      ? `SELECT ${COLS} ${FROM} WHERE m.room_id = ? AND m.id > ? ORDER BY m.id LIMIT 200`
      : `SELECT * FROM (SELECT ${COLS} ${FROM} WHERE m.room_id = ? ORDER BY m.id DESC LIMIT 100) t ORDER BY id`,
    after ? [id, after] : [id]);
  // curtidas das últimas 200 mensagens (muda em mensagens antigas, então vem sempre)
  const [likes] = await pool.query(
    `SELECT l.message_id id, COUNT(*) n, SUM(l.liker = ?) mine FROM message_likes l
     JOIN (SELECT id FROM messages WHERE room_id = ? ORDER BY id DESC LIMIT 200) t ON t.id = l.message_id GROUP BY l.message_id`,
    [likerOf(user, req.headers.get("x-guest")), id]);
  const likeMap = Object.fromEntries(likes.map((l) => [l.id, { n: Number(l.n), mine: Number(l.mine) > 0 }]));
  return Response.json({ messages: rows, likes: likeMap, call: await callStatus(pool, id) });
}

export async function POST(req, { params }) {
  const { id } = await params;
  const { body, guestName, fileId, replyTo } = await req.json();
  const text = String(body || "").trim().slice(0, 2000);
  if (!text && !fileId) return Response.json({ error: "Mensagem vazia" }, { status: 400 });
  const user = await getUser();
  const author = user ? user.name : (String(guestName || "").trim().slice(0, 40) || "Anônimo") ;
  const pool = await db();
  const denied = await guard(pool, id, req, user);
  if (denied) return denied;
  let file_id = null, file_mime = null;
  if (fileId) {
    const [f] = await pool.query("SELECT id, mime FROM files WHERE id = ?", [fileId]);
    if (f.length) { file_id = f[0].id; file_mime = f[0].mime; }
  }
  let reply = null;
  if (replyTo) {
    const [x] = await pool.query("SELECT id, author, LEFT(body, 140) body, file_mime FROM messages WHERE id = ? AND room_id = ?", [replyTo, id]);
    reply = x[0] || null;
  }
  const [r] = await pool.query("INSERT INTO messages (room_id, author, user_id, body, file_id, file_mime, reply_to) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, author, user?.id ?? null, text, file_id, file_mime, reply?.id ?? null]);
  return Response.json({ message: {
    id: r.insertId, author, user_id: user?.id ?? null, body: text, file_id, file_mime, created_at: new Date(),
    reply_to: reply?.id ?? null, reply_author: reply?.author, reply_body: reply?.body, reply_file: reply?.file_mime,
  } });
}
