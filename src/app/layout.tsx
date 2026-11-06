import type { Metadata, Viewport } from "next";
import { Figtree, Noto_Sans_Sinhala } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { FeedbackProvider } from "@/components/feedback";
import { LanguageGate } from "@/components/LanguageGate";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

const sinhala = Noto_Sans_Sinhala({ subsets: ["sinhala"], variable: "--font-sinhala" });

export const metadata: Metadata = { title: "Viraj Communication POS", description: "Shop management system" };

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = (await cookies()).get("lang")?.value === "si" ? "si" : "en";
  return (
    <html lang={lang} className={`${figtree.variable} ${sinhala.variable}`}>
      <body><LanguageGate><FeedbackProvider>{children}</FeedbackProvider></LanguageGate></body>
    </html>
  );
}
