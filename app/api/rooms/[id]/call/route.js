import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { canAccess } from "@/lib/rooms";
import { cleanup, participants, MAX_IN_CALL } from "@/lib/call";

const err = (error, status = 400) => Response.json({ error }, { status });
const cleanPeer = (p) => String(p || "").replace(/[^\w-]/g, "").slice(0, 40);

export async function POST(req, { params }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const peer = cleanPeer(b.peer);
  if (!peer) return err("peer inválido");
  const user = await getUser();
  const pool = await db();
  const [[room]] = await pool.query("SELECT * FROM rooms WHERE id = ?", [id]);
  if (!room) return err("Sala não existe", 404);
  if (!canAccess(room, user, b.key)) return err("Sem acesso a esta sala", 403);

  if (b.action === "leave") {
    await pool.query("DELETE FROM call_participants WHERE room_id = ? AND peer_id = ?", [id, peer]);
    await pool.query("DELETE FROM call_signals WHERE to_peer = ? OR from_peer = ?", [peer, peer]);
    await cleanup(pool, id);
    return Response.json({ ok: true });
  }

  if (b.action === "signal") {
    const to = cleanPeer(b.to);
    const data = JSON.stringify(b.data ?? null);
    if (!to || data.length > 200000) return err("sinal inválido");
    await pool.query("INSERT INTO call_signals (room_id, from_peer, to_peer, data) VALUES (?, ?, ?, ?)", [id, peer, to, data]);
    return Response.json({ ok: true });
  }

  const flags = [!!b.cam, !!b.mic, !!b.screen];

  if (b.action === "join") {
    if (room.kind !== "call" && !room.calls_enabled) return err("Chamadas estão desativadas nesta sala", 403);
    const n = await cleanup(pool, id);
    if (n >= MAX_IN_CALL) return err(`A chamada está cheia (máx. ${MAX_IN_CALL} pessoas)`, 409);
    const name = user ? user.name : String(b.name || "").trim().slice(0, 40) || "Anônimo";
    await pool.query(
      "REPLACE INTO call_participants (room_id, peer_id, name, user_id, cam, mic, screen) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, peer, name, user?.id ?? null, ...flags]);
    // em sala de chat, a primeira pessoa cria o aviso de chamada
    if (room.kind !== "call") {
      const [[r]] = await pool.query("SELECT call_msg_id FROM rooms WHERE id = ?", [id]);
      if (!r.call_msg_id) {
        const kind = b.kind === "audio" ? "audio" : "video";
        const [m] = await pool.query("INSERT INTO messages (room_id, author, user_id, body, call_kind) VALUES (?, ?, ?, '', ?)",
          [id, name, user?.id ?? null, kind]);
        await pool.query("UPDATE rooms SET call_msg_id = ? WHERE id = ?", [m.insertId, id]);
      }
    }
    return Response.json({ participants: await participants(pool, id) });
  }

  if (b.action === "poll") {
    const [u] = await pool.query(
      "UPDATE call_participants SET last_seen = NOW(), cam = ?, mic = ?, screen = ? WHERE room_id = ? AND peer_id = ?",
      [...flags, id, peer]);
    if (!u.affectedRows) return err("Você saiu da chamada", 410);
    await cleanup(pool, id);
    const after = Number(b.after || 0);
    const [sig] = await pool.query("SELECT id, from_peer, data FROM call_signals WHERE to_peer = ? AND id > ? ORDER BY id", [peer, after]);
    if (after) await pool.query("DELETE FROM call_signals WHERE to_peer = ? AND id <= ?", [peer, after]);
    return Response.json({
      participants: await participants(pool, id),
      signals: sig.map((s) => ({ id: s.id, from: s.from_peer, data: JSON.parse(s.data) })),
    });
  }

  return err("ação inválida");
}
