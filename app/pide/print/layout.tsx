import type { Metadata } from "next";

// Print page is a client component; mark it noindex from this server layout.
export const metadata: Metadata = {
  title: "Imprimir solicitud",
  robots: { index: false, follow: false },
};

export default function PidePrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
