import type { ReportReason, ReportStatus } from "./types";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  inappropriate_photos: "Fotos inapropiadas",
  harassment: "Acoso",
  child_safety: "Seguridad infantil",
  spam: "Spam",
  fake_profile: "Perfil falso",
  scam: "Estafa",
  other: "Otro",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  resolved: "Resuelto",
};

export const ADMIN_ACTION_LABELS: Record<string, string> = {
  "auth.login": "Inicio de sesión",
  "user.ban": "Baneo de usuario",
  "user.unban": "Desbaneo de usuario",
  "report.review": "Reporte revisado",
  "report.resolve": "Reporte resuelto",
  "report.reopen": "Reporte reabierto",
  "dog.deactivate": "Perro desactivado",
  "dog.activate": "Perro reactivado",
  "admin.create": "Admin creado",
  "admin.remove": "Admin eliminado",
};

export function adminActionLabel(action: string): string {
  return ADMIN_ACTION_LABELS[action] ?? action;
}

export const ADMIN_ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  superadmin: "Superadmin",
};

export function adminRoleLabel(role: string): string {
  return ADMIN_ROLE_LABELS[role] ?? role;
}

export const DOG_SEX_LABELS: Record<string, string> = {
  male: "Macho",
  female: "Hembra",
};

export const DOG_SIZE_LABELS: Record<string, string> = {
  small: "Pequeño",
  medium: "Mediano",
  large: "Grande",
};
