import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { PreferencesProvider } from "@/components/providers/preferences";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "KMG Onboarding Portal",
  description:
    "Корпоративный портал онбординга KMG с автоматизированными процессами и AI-ассистентом на базе RAG."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <StoreProvider>
          <PreferencesProvider>
            <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
          </PreferencesProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
