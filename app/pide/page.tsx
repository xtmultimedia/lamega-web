import type { Metadata } from "next";
import { FormApp } from "@/components/form/FormApp";

export const metadata: Metadata = {
  title: "La Mega 99.9 — Pide tu canción · Publicita",
};

export default function PidePage() {
  return <FormApp />;
}
