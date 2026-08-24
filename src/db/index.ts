import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * تهيئة كسولة: يُقرأ DATABASE_URL عند أول استعلام فعلي فقط —
 * حتى لا يفشل «جمع بيانات الصفحات» أثناء البناء على منصات مثل Vercel
 * حيث قد تكون متغيرات البيئة غير موجودة لحظة build.
 */
let client: NodePgDatabase | undefined;

function getClient(): NodePgDatabase {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  if (!client) {
    client = drizzle(new Pool({ connectionString: databaseUrl }));
  }
  return client;
}

export const db = new Proxy({} as NodePgDatabase, {
  get(_target, prop: string | symbol) {
    const c = getClient() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(c, prop);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(c)
      : value;
  },
});
