import type { Metadata } from "next";
import { FormApp } from "@/components/form/FormApp";

export const metadata: Metadata = {
  title: "Pide tu canción · Publicita",
  description:
    "Pide tu canción en La Mega 99.9 FM o publicita tu negocio en la radio líder de Imbabura. Dedicatorias al aire y planes comerciales en Ibarra, Ecuador.",
  alternates: { canonical: "/pide" },
};

export default function PidePage() {
  return <FormApp />;
}
