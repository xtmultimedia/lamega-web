import type { Metadata } from "next";

// Public page (there's no session yet) — keep it out of search results.
// The title serves both flows this page handles (first invite and password
// reset); the heading inside switches on ?reset=1, but metadata can't.
export const metadata: Metadata = {
  title: "Acceso al panel",
  robots: { index: false, follow: false },
};

export default function AdminInviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
