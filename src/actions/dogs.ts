"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { execute } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

const SET_NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

export async function setDogActive(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const dogId = String(formData.get("dogId") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  if (!dogId) throw new Error("missing_dog_id");

  await execute(`UPDATE dogs SET is_active = ?, updated_at = ${SET_NOW} WHERE id = ?`, active ? 1 : 0, dogId);
  await writeAuditLog({
    adminEmail: admin.email,
    action: active ? "dog.activate" : "dog.deactivate",
    targetType: "dog",
    targetId: dogId,
  });

  // The dog toggle + active badge appear on /dogs, /reports/[id] and /users/[id].
  revalidatePath("/dogs");
  revalidatePath("/users", "layout");
  revalidatePath("/reports", "layout");
}
