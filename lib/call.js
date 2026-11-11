import { STALE } from "@/lib/rooms";

export const MAX_IN_CALL = 10;

// tira quem sumiu e encerra a chamada se ficou vazia
export async function cleanup(pool, roomId) {
  await pool.query(`DELETE FROM call_participants WHERE room_id = ? AND last_seen < ${STALE}`, [roomId]);
  await pool.query("DELETE FROM call_signals WHERE room_id = ? AND created_at < NOW() - INTERVAL 2 MINUTE", [roomId]);
  const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM call_participants WHERE room_id = ?", [roomId]);
  if (!n) {
    const [[room]] = await pool.query("SELECT call_msg_id FROM rooms WHERE id = ?", [roomId]);
    if (room?.call_msg_id) {
      await pool.query("UPDATE messages SET call_ended_at = NOW() WHERE id = ? AND call_ended_at IS NULL", [room.call_msg_id]);
      await pool.query("UPDATE rooms SET call_msg_id = NULL WHERE id = ?", [roomId]);
    }
  }
  return n;
}

export async function participants(pool, roomId) {
  const [rows] = await pool.query(
    "SELECT peer_id, name, user_id, cam, mic, screen FROM call_participants WHERE room_id = ? ORDER BY joined_at", [roomId]);
  return rows.map((p) => ({ ...p, cam: !!p.cam, mic: !!p.mic, screen: !!p.screen }));
}

export async function callStatus(pool, roomId) {
  const count = await cleanup(pool, roomId);
  const [[room]] = await pool.query(
    "SELECT r.call_msg_id, m.call_kind FROM rooms r LEFT JOIN messages m ON m.id = r.call_msg_id WHERE r.id = ?", [roomId]);
  return { count, msg_id: room?.call_msg_id || null, kind: room?.call_kind || null };
}
