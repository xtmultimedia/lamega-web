import type { Metadata } from "next";

// Login is a client component, so it can't export metadata itself.
// Mark the whole /admin/login subtree noindex from here.
export const metadata: Metadata = {
  title: "Acceso · Panel Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
