import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";
import { currentRole } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Panel Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // middleware guarantees a session here; fall back to the most restricted role.
  const role = (await currentRole()) ?? "locutor";
  return <AdminApp role={role} />;
}
