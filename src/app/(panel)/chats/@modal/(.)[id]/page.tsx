import { ConversationView } from "@/components/ConversationView";
import { ChatModal } from "@/components/ChatModal";

export const dynamic = "force-dynamic";

// Intercepted route: soft-navigating from the chat list to /chats/[id] opens
// the conversation as a modal over the list. A direct load / refresh of
// /chats/[id] renders the full page (chats/[id]/page.tsx) instead, so the URL
// is shareable.
export default async function ConversationModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ChatModal>
      <ConversationView id={id} />
    </ChatModal>
  );
}
