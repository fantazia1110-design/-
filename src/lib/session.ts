import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SESSION_COOKIE = "msgr_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function getCookieSameSite(): "lax" | "none" {
  // الافتراضي "none" لأن عميل المنتج الأساسي هو إضافة كروم (الشريط الجانبي).
  // اضبط SESSION_SAMESITE=lax لمن لا يستخدم الإضافة أبدًا.
  return (process.env.SESSION_SAMESITE ?? "").toLowerCase() === "lax"
    ? "lax"
    : "none";
}

export async function createSession(userId: number) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id, userId, expiresAt });
  const store = await cookies();
  const sameSite = getCookieSameSite();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite,
    // SameSite=None requires Secure
    secure: sameSite === "none" ? true : process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const rows = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  return row.user;
}

export async function destroySession() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (id) {
    await db.delete(sessions).where(eq(sessions.id, id));
  }
  store.delete(SESSION_COOKIE);
}
