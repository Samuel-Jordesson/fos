import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { canAccess, publicRoom, newToken, newCode, cleanCode, ROOM_SQL } from "@/lib/rooms";
export const dynamic = "force-dynamic";

async function load(id) {
  const pool = await db();
  const [rows] = await pool.query(`${ROOM_SQL} WHERE r.id = ?`, [id]);
  return [pool, rows[0]];
}

// abrir sala (usado pelo link de convite)
export async function GET(req, { params }) {
  const { id } = await params;
  const key = new URL(req.url).searchParams.get("key");
  const user = await getUser();
  const [, room] = await load(id);
  if (!room) return Response.json({ error: "Sala não existe" }, { status: 404 });
  if (!canAccess(room, user, key)) return Response.json({ error: "Link ou código inválido" }, { status: 403 });
  return Response.json({ room: publicRoom(room, user) });
}

// editar sala (só o dono)
export async function PATCH(req, { params }) {
  const { id } = await params;
  const user = await getUser();
  const [pool, room] = await load(id);
  if (!room) return Response.json({ error: "Sala não existe" }, { status: 404 });
  if (!user || room.owner_id !== user.id) return Response.json({ error: "Só o criador pode editar" }, { status: 403 });
  const b = await req.json();
  const name = b.name !== undefined ? String(b.name).trim().slice(0, 80) : room.name;
  if (!name) return Response.json({ error: "Nome da sala obrigatório" }, { status: 400 });
  const isPrivate = b.is_private !== undefined ? !!b.is_private : !!room.is_private;
  const hidden = b.hidden !== undefined ? !!b.hidden : !!room.hidden;
  const callsEnabled = b.calls_enabled !== undefined ? !!b.calls_enabled : !!room.calls_enabled;
  let code = room.access_code;
  if (b.new_code) code = newCode();
  else if (b.access_code !== undefined) code = cleanCode(b.access_code);
  if (isPrivate && !code) code = newCode();
  if (code && code.length < 4) return Response.json({ error: "Código precisa ter pelo menos 4 caracteres" }, { status: 400 });
  const token = b.new_link ? newToken() : room.invite_token;
  try {
    await pool.query("UPDATE rooms SET name = ?, is_private = ?, hidden = ?, access_code = ?, invite_token = ?, calls_enabled = ? WHERE id = ?",
      [name, isPrivate, hidden, code || null, token, callsEnabled, id]);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return Response.json({ error: "Esse código já está em uso, escolha outro" }, { status: 409 });
    throw e;
  }
  const [, updated] = await load(id);
  return Response.json({ room: publicRoom(updated, user) });
}

export async function DELETE(req, { params }) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const pool = await db();
  const [[own]] = await pool.query("SELECT id FROM rooms WHERE id = ? AND owner_id = ?", [id, user.id]);
  if (!own) return Response.json({ error: "Você só pode apagar suas salas" }, { status: 403 });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE f FROM files f JOIN messages m ON m.file_id = f.id WHERE m.room_id = ?", [id]);
    await conn.query("DELETE FROM rooms WHERE id = ?", [id]); // mensagens, curtidas, chamadas: cascata
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  return Response.json({ ok: true });
}
