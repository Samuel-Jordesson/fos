import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = () => process.env.JWT_SECRET || "dev-secret";

export async function setSession(user) {
  const token = jwt.sign({ id: user.id, name: user.name }, SECRET(), { expiresIn: "30d" });
  (await cookies()).set("session", token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getUser() {
  const t = (await cookies()).get("session")?.value;
  if (!t) return null;
  try { const { id, name } = jwt.verify(t, SECRET()); return { id, name }; }
  catch { return null; }
}

export async function clearSession() {
  (await cookies()).delete("session");
}
