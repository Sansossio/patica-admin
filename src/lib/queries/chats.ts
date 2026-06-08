import "server-only";
import { queryAll, queryFirst } from "../db";
import { cdnUrl } from "../cdn";
import type { ConversationRow, MessageRow, DogRow, UserRow } from "../types";

export type ConversationListItem = ConversationRow & {
  a_dog_name: string | null;
  a_owner_name: string | null;
  b_dog_name: string | null;
  b_owner_name: string | null;
  message_count: number;
  last_text: string | null;
};

export async function listConversations(opts: {
  q?: string;
  page: number;
  pageSize: number;
}): Promise<{ items: ConversationListItem[]; hasNext: boolean }> {
  const { q, page, pageSize } = opts;
  const where: string[] = [];
  const params: unknown[] = [];
  const term = q?.trim();
  if (term) {
    where.push(
      "(da.name LIKE ? OR db.name LIKE ? OR ua.name LIKE ? OR ub.name LIKE ? OR ua.email LIKE ? OR ub.email LIKE ?)",
    );
    const like = `%${term}%`;
    params.push(like, like, like, like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const rows = await queryAll<ConversationListItem>(
    `SELECT c.*,
       da.name AS a_dog_name, ua.name AS a_owner_name,
       db.name AS b_dog_name, ub.name AS b_owner_name,
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
       (SELECT m.text FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_text
     FROM conversations c
     JOIN dogs da ON da.id = c.dog_a_id
     JOIN dogs db ON db.id = c.dog_b_id
     JOIN users ua ON ua.id = da.owner_id
     JOIN users ub ON ub.id = db.owner_id
     ${whereSql}
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
     LIMIT ? OFFSET ?`,
    ...params,
    pageSize + 1,
    offset,
  );

  return { items: rows.slice(0, pageSize), hasNext: rows.length > pageSize };
}

export type MessageMedia = { images: string[]; audios: string[]; videos: string[] };

export type MessageView = MessageRow & {
  sender_dog_name: string | null;
  sender_user_name: string | null;
  sender_user_email: string;
  media: MessageMedia;
};

export type ConversationParticipant = {
  dog: Omit<DogRow, "image_url"> & { image_url: string | null };
  owner: Pick<UserRow, "id" | "name" | "email" | "banned_until">;
};

export type ConversationDetail = {
  conversation: ConversationRow;
  a: ConversationParticipant | null;
  b: ConversationParticipant | null;
  messages: MessageView[];
};

async function loadParticipant(dogId: string): Promise<ConversationParticipant | null> {
  const dog = await queryFirst<DogRow>("SELECT * FROM dogs WHERE id = ?", dogId);
  if (!dog) return null;
  const owner = await queryFirst<Pick<UserRow, "id" | "name" | "email" | "banned_until">>(
    "SELECT id, name, email, banned_until FROM users WHERE id = ?",
    dog.owner_id,
  );
  return {
    dog: { ...dog, image_url: cdnUrl(dog.image_url) },
    owner: owner ?? { id: dog.owner_id, name: null, email: "", banned_until: null },
  };
}

export async function getConversationDetail(id: string): Promise<ConversationDetail | null> {
  const conversation = await queryFirst<ConversationRow>(
    "SELECT * FROM conversations WHERE id = ?",
    id,
  );
  if (!conversation) return null;

  const [a, b, rawMessages, images, audios, videos] = await Promise.all([
    loadParticipant(conversation.dog_a_id),
    loadParticipant(conversation.dog_b_id),
    queryAll<
      MessageRow & {
        sender_dog_name: string | null;
        sender_user_name: string | null;
        sender_user_email: string;
      }
    >(
      `SELECT m.*, sd.name AS sender_dog_name, su.name AS sender_user_name, su.email AS sender_user_email
       FROM messages m
       JOIN dogs sd ON sd.id = m.sender_dog_id
       JOIN users su ON su.id = m.sender_user_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at DESC`,
      id,
    ),
    queryAll<{ message_id: string; image_key: string }>(
      `SELECT mi.message_id, mi.image_key FROM message_images mi
       JOIN messages m ON m.id = mi.message_id WHERE m.conversation_id = ?`,
      id,
    ),
    queryAll<{ message_id: string; audio_key: string }>(
      `SELECT ma.message_id, ma.audio_key FROM message_audios ma
       JOIN messages m ON m.id = ma.message_id WHERE m.conversation_id = ?`,
      id,
    ),
    queryAll<{ message_id: string; video_key: string }>(
      `SELECT mv.message_id, mv.video_key FROM message_videos mv
       JOIN messages m ON m.id = mv.message_id WHERE m.conversation_id = ?`,
      id,
    ),
  ]);

  const media = new Map<string, MessageMedia>();
  const ensure = (mid: string) => {
    let m = media.get(mid);
    if (!m) {
      m = { images: [], audios: [], videos: [] };
      media.set(mid, m);
    }
    return m;
  };
  for (const r of images) {
    const u = cdnUrl(r.image_key);
    if (u) ensure(r.message_id).images.push(u);
  }
  for (const r of audios) {
    const u = cdnUrl(r.audio_key);
    if (u) ensure(r.message_id).audios.push(u);
  }
  for (const r of videos) {
    const u = cdnUrl(r.video_key);
    if (u) ensure(r.message_id).videos.push(u);
  }

  const messages: MessageView[] = rawMessages.map((m) => ({
    ...m,
    media: media.get(m.id) ?? { images: [], audios: [], videos: [] },
  }));

  return { conversation, a, b, messages };
}
