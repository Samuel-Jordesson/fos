import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { cleanCode, publicRoom, ROOM_SQL } from "@/lib/rooms";

// entrar numa sala privada com o código
export async function POST(req) {
  const { code, roomId } = await req.json();
  const c = cleanCode(code);
  if (!c) return Response.json({ error: "Digite o código" }, { status: 400 });
  const pool = await db();
  const [rows] = await pool.query(`${ROOM_SQL} WHERE r.access_code = ?${roomId ? " AND r.id = ?" : ""}`, roomId ? [c, roomId] : [c]);
  if (!rows.length) return Response.json({ error: "Código inválido" }, { status: 403 });
  return Response.json({ room: publicRoom(rows[0], await getUser()), key: c });
}
