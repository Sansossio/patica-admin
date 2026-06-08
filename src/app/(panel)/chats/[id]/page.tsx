import Link from "next/link";
import { ConversationView } from "@/components/ConversationView";
import { IconChevronLeft } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <Link
        href="/chats"
        prefetch
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition hover:text-text"
      >
        <IconChevronLeft className="h-4 w-4" /> Chats
      </Link>

      <ConversationView id={id} />
    </>
  );
}
