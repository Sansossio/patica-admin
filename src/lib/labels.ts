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

// ── User event labels (app analytics events stored in user_events) ───────────
// Curated friendly labels for the most common events; anything not listed falls
// back to a humanized version of the snake_case event name. Keep additions here
// as the app introduces new events (see app/src/services/analyticsService.ts).
export const USER_EVENT_LABELS: Record<string, string> = {
  // Auth
  auth_open_login: "Abrió inicio de sesión",
  auth_google_sign_in_started: "Login con Google iniciado",
  auth_google_sign_in_success: "Login con Google completado",
  auth_google_sign_in_failed: "Login con Google falló",
  auth_apple_sign_in_started: "Login con Apple iniciado",
  auth_apple_sign_in_success: "Login con Apple completado",
  auth_apple_sign_in_failed: "Login con Apple falló",
  auth_guest_login: "Entró como invitado",
  auth_logout: "Cerró sesión",
  auth_terms_opened: "Abrió términos",
  auth_privacy_opened: "Abrió privacidad",
  // Onboarding
  onboarding_started: "Onboarding iniciado",
  onboarding_step_completed: "Paso de onboarding completado",
  onboarding_completed: "Onboarding completado",
  onboarding_failed: "Onboarding falló",
  // Pack (Manada)
  pack_add_dog_started: "Empezó a añadir perro",
  pack_edit_dog_started: "Empezó a editar perro",
  pack_dog_saved: "Perro guardado",
  pack_dog_save_failed: "Guardado de perro falló",
  pack_dog_deleted: "Perro eliminado",
  pack_dog_delete_failed: "Borrado de perro falló",
  pack_editor_step_completed: "Paso del editor completado",
  pack_editor_image_added: "Imagen añadida al editor",
  // Radar
  radar_view_changed: "Cambió vista del radar",
  radar_list_dog_opened: "Abrió perro desde el radar",
  radar_filters_reset: "Reinició filtros del radar",
  radar_filter_breeds_applied: "Filtro de razas aplicado",
  radar_filter_radius_applied: "Filtro de radio aplicado",
  radar_filter_sex_applied: "Filtro de sexo aplicado",
  radar_remove_radius_limit: "Quitó límite de radio",
  radar_like_guest_prompt: "Like de invitado (radar)",
  radar_report_submitted: "Reporte enviado (radar)",
  // Territorio (mapa)
  territorio_view_changed: "Cambió vista del territorio",
  territorio_map_recenter: "Recentró el mapa",
  territorio_map_zoom_in: "Zoom in en el mapa",
  territorio_map_zoom_out: "Zoom out en el mapa",
  territorio_dog_marker_opened: "Abrió marcador de perro",
  territorio_dog_list_opened: "Abrió lista de perros (territorio)",
  territorio_place_detail_opened: "Abrió detalle de lugar",
  territorio_place_show_on_map: "Mostró lugar en el mapa",
  territorio_place_call_tapped: "Tocó llamar a lugar",
  territorio_place_whatsapp_tapped: "Tocó WhatsApp de lugar",
  territorio_report_submitted: "Reporte enviado (territorio)",
  // Chat
  chat_open_from_list: "Abrió chat desde la lista",
  chat_message_sent: "Mensaje enviado",
  chat_message_send_failed: "Envío de mensaje falló",
  chat_audio_sent: "Audio enviado",
  chat_audio_played: "Audio reproducido",
  chat_reaction_added: "Reacción añadida",
  chat_reaction_toggled: "Reacción alternada",
  chat_reply_started: "Empezó a responder",
  chat_conversation_deleted: "Conversación eliminada",
  chat_conversation_pinned: "Conversación fijada",
  chat_conversation_unpinned: "Conversación desfijada",
  chat_owner_profile_opened: "Abrió perfil del dueño",
  chat_report_submitted: "Reporte enviado (chat)",
  chat_wallpaper_changed: "Cambió fondo de chat",
  // Dog likes
  dog_like_given: "Dio like a un perro",
  dog_like_removed: "Quitó like a un perro",
  // Settings
  settings_profile_photo_updated: "Foto de perfil actualizada",
  settings_notifications_toggled: "Cambió notificaciones",
  settings_last_seen_toggled: "Cambió última conexión",
  settings_theme_mode_changed: "Cambió tema",
  settings_account_deletion_initiated: "Borrado de cuenta iniciado",
  settings_account_deletion_success: "Cuenta eliminada",
  settings_account_deletion_failed: "Borrado de cuenta falló",
  // Social
  user_blocked: "Bloqueó a un usuario",
  user_unblocked: "Desbloqueó a un usuario",
  blocked_users_opened: "Abrió usuarios bloqueados",
  // Misc
  att_prompt_result: "Resultado del permiso ATT",
  explorar_mode_changed: "Cambió modo de exploración",
  // Server-side events (platform = "server"; fired by the api for all builds).
  // The Activity view counts these exclusively so numbers are build-independent.
  app_active: "Activo en la app",
  radar_viewed: "Vio el radar",
  map_viewed: "Vio el mapa",
  dogs_seen: "Marcó perros vistos",
  dog_created: "Creó un perro",
  dog_updated: "Editó un perro",
  dog_photo_uploaded: "Subió foto de perro",
  location_updated: "Actualizó ubicación",
};

/**
 * Friendly Spanish label for a user_events event name. Falls back to a humanized
 * version of the raw snake_case name (e.g. "some_new_event" → "Some new event").
 */
export function userEventLabel(event: string): string {
  const known = USER_EVENT_LABELS[event];
  if (known) return known;
  const spaced = event.replace(/_/g, " ").trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : event;
}
