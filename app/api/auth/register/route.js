import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  const { name, email, password } = await req.json();
  const n = String(name || "").trim();
  const e = String(email || "").trim().toLowerCase();
  if (n.length < 3 || n.length > 40) return Response.json({ error: "Nome deve ter de 3 a 40 caracteres" }, { status: 400 });
  if (!EMAIL.test(e) || e.length > 190) return Response.json({ error: "E-mail inválido" }, { status: 400 });
  if (String(password || "").length < 6) return Response.json({ error: "Senha precisa ter pelo menos 6 caracteres" }, { status: 400 });
  const pool = await db();
  const [byEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [e]);
  if (byEmail.length) return Response.json({ error: "Esse e-mail já tem conta" }, { status: 409 });
  const [byName] = await pool.query("SELECT id FROM users WHERE name = ?", [n]);
  if (byName.length) return Response.json({ error: "Esse nome de usuário já está em uso" }, { status: 409 });
  const hash = await bcrypt.hash(password, 10);
  const [r] = await pool.query("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [n, e, hash]);
  const user = { id: r.insertId, name: n };
  await setSession(user);
  return Response.json({ user });
}
