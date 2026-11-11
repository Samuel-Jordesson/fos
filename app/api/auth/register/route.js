import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(req) {
  const { name, password } = await req.json();
  const n = String(name || "").trim();
  if (n.length < 3 || n.length > 40) return Response.json({ error: "Nome deve ter de 3 a 40 caracteres" }, { status: 400 });
  if (String(password || "").length < 4) return Response.json({ error: "Senha muito curta (mín. 4)" }, { status: 400 });
  const pool = await db();
  const [exists] = await pool.query("SELECT id FROM users WHERE name = ?", [n]);
  if (exists.length) return Response.json({ error: "Esse nome já está em uso" }, { status: 409 });
  const hash = await bcrypt.hash(password, 10);
  const [r] = await pool.query("INSERT INTO users (name, password_hash) VALUES (?, ?)", [n, hash]);
  const user = { id: r.insertId, name: n };
  await setSession(user);
  return Response.json({ user });
}
