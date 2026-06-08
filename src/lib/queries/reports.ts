import "server-only";
import { queryAll, queryFirst } from "../db";
import { cdnUrl } from "../cdn";
import type { ReportRow, ReportStatus, UserRow, DogRow } from "../types";

export type ReportListItem = ReportRow & {
  dog_name: string | null;
  dog_image_key: string;
  dog_active: number;
  owner_id: string;
  owner_name: string | null;
  owner_email: string;
  owner_banned_until: string | null;
  reporter_name: string | null;
  reporter_email: string;
};

export type ReportListItemView = ReportListItem & { dog_image_url: string | null };

export async function listReports(opts: {
  status?: ReportStatus | "all";
  page: number;
  pageSize: number;
}): Promise<{ items: ReportListItemView[]; hasNext: boolean }> {
  const { status = "all", page, pageSize } = opts;
  const where: string[] = [];
  const params: unknown[] = [];
  if (status !== "all") {
    where.push("r.status = ?");
    params.push(status);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const rows = await queryAll<ReportListItem>(
    `SELECT r.*,
       d.name AS dog_name, d.image_url AS dog_image_key, d.is_active AS dog_active,
       owner.id AS owner_id, owner.name AS owner_name, owner.email AS owner_email,
       owner.banned_until AS owner_banned_until,
       reporter.name AS reporter_name, reporter.email AS reporter_email
     FROM reports r
     JOIN dogs d ON d.id = r.reported_dog_id
     JOIN users owner ON owner.id = d.owner_id
     JOIN users reporter ON reporter.id = r.reporter_user_id
     ${whereSql}
     ORDER BY (r.status = 'pending') DESC, r.created_at DESC
     LIMIT ? OFFSET ?`,
    ...params,
    pageSize + 1,
    offset,
  );

  const items = rows.slice(0, pageSize).map((r) => ({ ...r, dog_image_url: cdnUrl(r.dog_image_key) }));
  return { items, hasNext: rows.length > pageSize };
}

export async function countReportsByStatus(): Promise<Record<ReportStatus | "all", number>> {
  const rows = await queryAll<{ status: ReportStatus; count: number }>(
    "SELECT status, COUNT(*) AS count FROM reports GROUP BY status",
  );
  const out = { all: 0, pending: 0, reviewed: 0, resolved: 0 } as Record<ReportStatus | "all", number>;
  for (const r of rows) {
    out[r.status] = r.count;
    out.all += r.count;
  }
  return out;
}

export type ReportDetail = {
  report: ReportRow;
  dog: (Omit<DogRow, "image_url"> & { image_url: string | null; gallery: string[] }) | null;
  owner: UserRow | null;
  reporter: Pick<UserRow, "id" | "name" | "email"> | null;
  otherReports: ReportRow[];
};

export async function getReportDetail(id: string): Promise<ReportDetail | null> {
  const report = await queryFirst<ReportRow>("SELECT * FROM reports WHERE id = ?", id);
  if (!report) return null;

  const dogRow = await queryFirst<DogRow>("SELECT * FROM dogs WHERE id = ?", report.reported_dog_id);
  const owner = dogRow
    ? await queryFirst<UserRow>("SELECT * FROM users WHERE id = ?", dogRow.owner_id)
    : null;
  const reporter = await queryFirst<Pick<UserRow, "id" | "name" | "email">>(
    "SELECT id, name, email FROM users WHERE id = ?",
    report.reporter_user_id,
  );
  const otherReports = await queryAll<ReportRow>(
    "SELECT * FROM reports WHERE reported_dog_id = ? AND id != ? ORDER BY created_at DESC",
    report.reported_dog_id,
    id,
  );

  let dog: ReportDetail["dog"] = null;
  if (dogRow) {
    let gallery: string[] = [];
    try {
      const parsed = JSON.parse(dogRow.image_urls) as unknown;
      if (Array.isArray(parsed)) gallery = parsed.filter((k): k is string => typeof k === "string");
    } catch {
      /* not JSON */
    }
    if (gallery.length === 0 && dogRow.image_url) gallery = [dogRow.image_url];
    dog = {
      ...dogRow,
      image_url: cdnUrl(dogRow.image_url),
      gallery: gallery.map((k) => cdnUrl(k)).filter((u): u is string => !!u),
    };
  }

  return { report, dog, owner, reporter, otherReports };
}
