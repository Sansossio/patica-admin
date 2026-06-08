import type { ReactNode } from "react";

// Parallel route: `modal` slot renders the intercepted conversation modal over
// the chat list, while `children` keeps showing the list underneath.
export default function ChatsLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
