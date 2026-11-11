import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(req) {
  const { name, password } = await req.json();
  const pool = await db();
  const [rows] = await pool.query("SELECT * FROM users WHERE name = ?", [String(name || "").trim()]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(String(password || ""), u.password_hash)))
    return Response.json({ error: "Nome ou senha inválidos" }, { status: 401 });
  const user = { id: u.id, name: u.name };
  await setSession(user);
  return Response.json({ user });
}
