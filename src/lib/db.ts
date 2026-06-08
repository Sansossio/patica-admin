import { db } from "./cf";

/** Run a SELECT and return all rows (empty array if none). */
export async function queryAll<T>(sql: string, ...params: unknown[]): Promise<T[]> {
  const res = await db()
    .prepare(sql)
    .bind(...params)
    .all<T>();
  return res.results ?? [];
}

/** Run a SELECT and return the first row, or null. */
export async function queryFirst<T>(sql: string, ...params: unknown[]): Promise<T | null> {
  const row = await db()
    .prepare(sql)
    .bind(...params)
    .first<T>();
  return row ?? null;
}

/** Run a single-column aggregate (COUNT/SUM/...) and return the scalar. */
export async function scalar(sql: string, ...params: unknown[]): Promise<number> {
  const row = await db()
    .prepare(sql)
    .bind(...params)
    .first<Record<string, number>>();
  if (!row) return 0;
  const value = Object.values(row)[0];
  return typeof value === "number" ? value : Number(value ?? 0);
}

/** Run a write (INSERT/UPDATE/DELETE). */
export async function execute(sql: string, ...params: unknown[]) {
  return db()
    .prepare(sql)
    .bind(...params)
    .run();
}
