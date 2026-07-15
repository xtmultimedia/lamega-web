import type { Metadata } from "next";

// Public page (the invitee has no session yet) — keep it out of search results.
export const metadata: Metadata = {
  title: "Activar tu acceso",
  robots: { index: false, follow: false },
};

export default function AdminInviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
