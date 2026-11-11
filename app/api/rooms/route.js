import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { newToken, newCode, cleanCode, publicRoom, ROOM_SQL } from "@/lib/rooms";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const q = new URL(req.url).searchParams.get("q") || "";
  const user = await getUser();
  const pool = await db();
  const [rows] = await pool.query(
    `${ROOM_SQL} WHERE r.name LIKE ? AND (r.hidden = 0 OR r.owner_id = ?) ORDER BY r.created_at DESC LIMIT 200`,
    [`%${q}%`, user?.id ?? -1]);
  return Response.json({ rooms: rows.map((r) => publicRoom(r, user)) });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Faça login para criar salas" }, { status: 401 });
  const b = await req.json();
  const name = String(b.name || "").trim().slice(0, 80);
  if (!name) return Response.json({ error: "Nome da sala obrigatório" }, { status: 400 });
  const isPrivate = !!b.is_private;
  let code = isPrivate ? cleanCode(b.access_code) || newCode() : null;
  if (code && code.length < 4) return Response.json({ error: "Código precisa ter pelo menos 4 caracteres" }, { status: 400 });
  const pool = await db();
  try {
    const [r] = await pool.query(
      "INSERT INTO rooms (name, owner_id, is_private, hidden, access_code, invite_token, kind) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, user.id, isPrivate, !!b.hidden, code, newToken(), b.kind === "call" ? "call" : "chat"]);
    const [rows] = await pool.query(`${ROOM_SQL} WHERE r.id = ?`, [r.insertId]);
    return Response.json({ room: publicRoom(rows[0], user) });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return Response.json({ error: "Esse código já está em uso, escolha outro" }, { status: 409 });
    throw e;
  }
}
