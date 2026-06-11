import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "La Mega 99.9 — Panel Admin",
};

export default function AdminPage() {
  return <AdminApp />;
}
