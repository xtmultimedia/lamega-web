import type { Metadata } from "next";
import { Saira, Sora, Space_Mono } from "next/font/google";
import "./globals.css";

const saira = Saira({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-saira",
});
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "La Mega 99.9 — Solo La Mega · Supera a La Mega",
  description:
    "La radio que manda en Ecuador. Reggaetón, pop y los hits que mueven al país — al aire las 24 horas desde Guayaquil.",
  icons: { icon: "/assets/mega-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${saira.variable} ${sora.variable} ${spaceMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
