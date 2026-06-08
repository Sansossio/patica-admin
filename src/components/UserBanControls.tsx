"use client";

import { useState } from "react";
import { banUser, unbanUser } from "@/actions/users";
import { SubmitButton } from "./SubmitButton";
import { IconBan, IconCheck } from "./icons";
import { buttonClass } from "@/lib/button";

export function UserBanControls({
  userId,
  banned,
}: {
  userId: string;
  banned: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (banned) {
    return (
      <form action={unbanUser}>
        <input type="hidden" name="userId" value={userId} />
        <SubmitButton variant="success" confirm="¿Levantar el baneo de esta cuenta?">
          <IconCheck className="h-4 w-4" /> Desbanear
        </SubmitButton>
      </form>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("danger")}>
        <IconBan className="h-4 w-4" /> Banear
      </button>
    );
  }

  return (
    <form
      action={banUser}
      className="w-full max-w-md space-y-3 rounded-(--radius-card) border border-danger/30 bg-danger/5 p-4"
    >
      <input type="hidden" name="userId" value={userId} />
      <p className="text-sm font-semibold text-danger">Banear cuenta</p>

      <label className="block text-xs font-medium text-muted">
        Motivo
        <textarea
          name="reason"
          rows={2}
          placeholder="Motivo del baneo (queda en el histórico)"
          className="mt-1 w-full rounded-(--radius-button) border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-subtle outline-none focus:border-danger/60"
        />
      </label>

      <label className="block text-xs font-medium text-muted">
        Duración
        <select
          name="duration"
          defaultValue="permanent"
          className="mt-1 w-full rounded-(--radius-button) border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-danger/60"
        >
          <option value="permanent">Permanente</option>
          <option value="1">1 día</option>
          <option value="7">7 días</option>
          <option value="30">30 días</option>
        </select>
      </label>

      <div className="flex gap-2">
        <SubmitButton variant="danger">Confirmar baneo</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
