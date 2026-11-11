import crypto from "node:crypto";

export const newToken = () => crypto.randomBytes(12).toString("hex");
export const newCode = () => {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.randomBytes(6), (b) => abc[b % abc.length]).join("");
};
export const cleanCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);

// quem pode ver/usar a sala
export function canAccess(room, user, key) {
  if (!room) return false;
  if (user && room.owner_id === user.id) return true;
  if (!room.is_private) return true;
  return !!key && (key === room.invite_token || cleanCode(key) === room.access_code);
}

// o que vai pro navegador (código e link só pro dono)
export function publicRoom(r, user) {
  const own = user && r.owner_id === user.id;
  return {
    id: r.id, name: r.name, owner_id: r.owner_id, owner: r.owner,
    is_private: !!r.is_private, hidden: !!r.hidden,
    kind: r.kind || "chat", calls_enabled: r.calls_enabled === undefined ? true : !!r.calls_enabled, in_call: Number(r.in_call || 0),
    ...(own ? { access_code: r.access_code, invite_token: r.invite_token } : {}),
  };
}

export const STALE = "NOW() - INTERVAL 12 SECOND";
export const ROOM_SQL = `SELECT r.*, u.name AS owner,
  (SELECT COUNT(*) FROM call_participants p WHERE p.room_id = r.id AND p.last_seen > ${STALE}) AS in_call
  FROM rooms r JOIN users u ON u.id = r.owner_id`;

export const likerOf = (user, guest) => user ? `u:${user.id}` : `g:${String(guest || "").trim().slice(0, 40)}`;
