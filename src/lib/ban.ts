// Ban model shared by queries, actions and UI.
//
// Enforcement state is the single `users.banned_until` column:
//   - null / past  => not banned
//   - future       => banned until that instant
//   - permanent    => far-future sentinel
// The detail + history of each ban/unban lives in the `user_bans` table.

export const PERMANENT_BAN_UNTIL = "9999-12-31T23:59:59Z";

const PERMANENT_THRESHOLD = new Date("9000-01-01T00:00:00Z").getTime();

export function isBanned(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false;
  return new Date(bannedUntil).getTime() > Date.now();
}

export function isPermanentBan(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false;
  return new Date(bannedUntil).getTime() >= PERMANENT_THRESHOLD;
}

export type BanLabel = { banned: boolean; permanent: boolean; until: string | null };

export function banInfo(bannedUntil: string | null | undefined): BanLabel {
  const banned = isBanned(bannedUntil);
  return {
    banned,
    permanent: banned && isPermanentBan(bannedUntil),
    until: banned && !isPermanentBan(bannedUntil) ? (bannedUntil ?? null) : null,
  };
}
