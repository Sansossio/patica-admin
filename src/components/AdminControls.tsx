"use client";

import { useActionState, useEffect, useState } from "react";
import { createAdmin, removeAdmin, type CreateAdminState } from "@/actions/admins";
import { SubmitButton } from "./SubmitButton";
import { Modal } from "./Modal";
import { ConfirmButton } from "./ConfirmButton";
import { IconShield, IconTrash } from "./icons";
import { buttonClass } from "@/lib/button";

// Shared field styling — explicit height so <select> matches the <input>s.
const FIELD =
  "h-10 w-full rounded-(--radius-button) border border-border bg-surface px-3 text-sm text-text placeholder:text-subtle outline-none focus:border-primary/60";

const INITIAL: CreateAdminState = { ok: false };

/** "Agregar admin" button that opens a modal with the create form. */
export function AdminCreateModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass("primary", "shrink-0 whitespace-nowrap")}
      >
        <IconShield className="h-4 w-4" /> Agregar admin
      </button>

      {/* Modal renders its children only while open, so useActionState resets. */}
      <Modal open={open} onClose={() => setOpen(false)} title="Agregar administrador">
        <AdminCreateForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function AdminCreateForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, action] = useActionState(createAdmin, INITIAL);

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={action} className="space-y-3">
      <label className="block text-xs font-medium text-muted">
        Email (cuenta de Google)
        <input
          type="email"
          name="email"
          required
          autoFocus
          placeholder="persona@gmail.com"
          className={`mt-1 ${FIELD}`}
        />
      </label>

      <label className="block text-xs font-medium text-muted">
        Nombre (opcional)
        <input type="text" name="name" placeholder="Nombre" className={`mt-1 ${FIELD}`} />
      </label>

      <label className="block text-xs font-medium text-muted">
        Rol
        <select name="role" defaultValue="admin" className={`mt-1 ${FIELD}`}>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </label>

      {state.error && (
        <p className="rounded-(--radius-button) border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className={buttonClass("ghost")}>
          Cancelar
        </button>
        <SubmitButton variant="primary" pendingLabel="Agregando…">
          <IconShield className="h-4 w-4" /> Agregar
        </SubmitButton>
      </div>
    </form>
  );
}

/** Delete action for an admin row. Disabled (with a reason) for the acting
 *  admin's own account and for the last active superadmin; otherwise opens a
 *  custom confirm modal. */
export function AdminDeleteButton({
  id,
  email,
  disabledReason,
}: {
  id: string;
  email: string;
  disabledReason?: string;
}) {
  if (disabledReason) {
    return (
      <button
        type="button"
        disabled
        title={disabledReason}
        className={buttonClass("ghost", "opacity-50")}
      >
        <IconTrash className="h-4 w-4" />
      </button>
    );
  }

  return (
    <ConfirmButton
      action={removeAdmin}
      fields={{ id }}
      variant="danger"
      title="Eliminar administrador"
      message={`¿Eliminar el acceso de ${email}? Pierde el acceso al panel inmediatamente.`}
      confirmLabel="Eliminar"
      pendingLabel="Eliminando…"
    >
      <IconTrash className="h-4 w-4" /> Eliminar
    </ConfirmButton>
  );
}
