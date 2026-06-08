import Link from "next/link";
import { getConversationDetail, type MessageView } from "@/lib/queries/chats";
import { Card, Avatar, EmptyState, cn } from "@/components/ui";
import { RemoteImage } from "@/components/RemoteImage";
import { BanBadge } from "@/components/badges";
import { IconChat } from "@/components/icons";
import { formatDateTime } from "@/lib/format";

export async function ConversationView({ id }: { id: string }) {
  const detail = await getConversationDetail(id);

  if (!detail) {
    return (
      <Card className="p-5">
        <EmptyState icon={<IconChat className="h-8 w-8" />} title="Conversación no encontrada" />
      </Card>
    );
  }

  const { conversation, a, b, messages } = detail;

  return (
    <>
      {/* Participants header */}
      <Card className="mb-4 flex flex-wrap items-center justify-between gap-4 p-5">
        <Participant
          dogName={a?.dog.name ?? null}
          dogImage={a?.dog.image_url ?? null}
          ownerId={a?.owner.id}
          ownerName={a?.owner.name ?? null}
          bannedUntil={a?.owner.banned_until ?? null}
        />
        <span className="text-subtle">↔</span>
        <Participant
          dogName={b?.dog.name ?? null}
          dogImage={b?.dog.image_url ?? null}
          ownerId={b?.owner.id}
          ownerName={b?.owner.name ?? null}
          bannedUntil={b?.owner.banned_until ?? null}
          alignRight
        />
      </Card>

      {/* Thread (newest first) */}
      <Card className="p-5">
        {messages.length === 0 ? (
          <EmptyState icon={<IconChat className="h-8 w-8" />} title="Sin mensajes" />
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} mine={a ? m.sender_dog_id === a.dog.id : false} />
            ))}
          </div>
        )}
      </Card>

      <p className="mt-3 text-center text-xs text-subtle">
        Conversación creada {formatDateTime(conversation.created_at)}. Los mensajes con más de un mes
        se eliminan automáticamente.
      </p>
    </>
  );
}

function Participant({
  dogName,
  dogImage,
  ownerId,
  ownerName,
  bannedUntil,
  alignRight,
}: {
  dogName: string | null;
  dogImage: string | null;
  ownerId?: string;
  ownerName: string | null;
  bannedUntil: string | null;
  alignRight?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", alignRight && "flex-row-reverse text-right")}>
      <Avatar src={dogImage} name={dogName} size={44} />
      <div>
        <p className="font-semibold">{dogName ?? "?"}</p>
        <div className={cn("flex items-center gap-2", alignRight && "flex-row-reverse")}>
          {ownerId ? (
            <Link href={`/users/${ownerId}`} prefetch className="text-xs text-muted hover:text-primary">
              {ownerName ?? "dueño"}
            </Link>
          ) : (
            <span className="text-xs text-muted">{ownerName ?? "—"}</span>
          )}
          <BanBadge bannedUntil={bannedUntil} />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, mine }: { message: MessageView; mine: boolean }) {
  const { media } = message;
  return (
    <div className={cn("flex", mine ? "justify-start" : "justify-end")}>
      <div className="max-w-[72%]">
        <div
          className={cn(
            "rounded-2xl border px-4 py-2.5",
            mine ? "border-border bg-surface-2" : "border-primary/30 bg-primary/10",
          )}
        >
          <p className="mb-1 text-[11px] font-medium text-subtle">
            {message.sender_dog_name ?? "?"} · {message.sender_user_name ?? message.sender_user_email}
          </p>

          {message.text && <p className="whitespace-pre-wrap text-sm">{message.text}</p>}

          {media.images.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {media.images.map((url) => (
                <RemoteImage
                  key={url}
                  src={url}
                  alt="adjunto"
                  className="max-h-48 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          )}

          {media.audios.map((url) => (
            <audio key={url} src={url} controls className="mt-2 w-full" />
          ))}

          {media.videos.map((url) => (
            <video key={url} src={url} controls className="mt-2 max-h-64 w-full rounded-lg" />
          ))}
        </div>
        <p className={cn("mt-0.5 px-1 text-[10px] text-subtle", mine ? "text-left" : "text-right")}>
          {formatDateTime(message.created_at)}
          {message.read_at ? " · leído" : ""}
        </p>
      </div>
    </div>
  );
}
