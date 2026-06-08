import "server-only";
import { queryAll } from "../db";
import { cdnUrl } from "../cdn";
import type { DogRow } from "../types";

export type DogFilter = "all" | "active" | "inactive" | "reported";

export type DogListItem = DogRow & {
  owner_name: string | null;
  owner_email: string;
  like_count: number;
  report_count: number;
};

export type DogListItemView = Omit<DogListItem, "image_url"> & { image_url: string | null };

export async function listDogs(opts: {
  q?: string;
  filter?: DogFilter;
  page: number;
  pageSize: number;
}): Promise<{ items: DogListItemView[]; hasNext: boolean }> {
  const { q, filter = "all", page, pageSize } = opts;
  const where: string[] = [];
  const having: string[] = [];
  const params: unknown[] = [];

  const term = q?.trim();
  if (term) {
    where.push("(d.name LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR d.id = ?)");
    params.push(`%${term}%`, `%${term}%`, `%${term}%`, term);
  }
  if (filter === "active") where.push("d.is_active = 1");
  if (filter === "inactive") where.push("d.is_active = 0");
  if (filter === "reported") having.push("report_count > 0");

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const havingSql = having.length ? `HAVING ${having.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const rows = await queryAll<DogListItem>(
    `SELECT d.*, u.name AS owner_name, u.email AS owner_email,
       (SELECT COUNT(*) FROM dog_likes dl WHERE dl.dog_id = d.id) AS like_count,
       (SELECT COUNT(*) FROM reports r WHERE r.reported_dog_id = d.id) AS report_count
     FROM dogs d
     JOIN users u ON u.id = d.owner_id
     ${whereSql}
     GROUP BY d.id
     ${havingSql}
     ORDER BY d.created_at DESC
     LIMIT ? OFFSET ?`,
    ...params,
    pageSize + 1,
    offset,
  );

  const items = rows.slice(0, pageSize).map((d) => ({ ...d, image_url: cdnUrl(d.image_url) }));
  return { items, hasNext: rows.length > pageSize };
}
