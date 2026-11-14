import type { Metadata } from "next";
import { Baloo_2, Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { TranslationProvider } from "@/lib/i18n/TranslationContext";
import { ThemeSelector } from "./components/ui/ThemeSelector";
import { LanguageSelector } from "./components/ui/LanguageSelector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The rounded face of titles and of the main actions. Like Geist it is downloaded when the app is built and
// served by the app itself: the browser of a player never asks another site for it.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "800"],
});

export const metadata: Metadata = {
  title: "(non)BinaryGames",
  description: "Calm games to play together in real time. Open a room, share the link and pick a box.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(geistSans.variable, geistMono.variable, baloo.variable, "h-full antialiased")}>
      <body className={cn(
        "min-h-full flex flex-col",
        "text-[var(--title-text)]",
        "transition-colors duration-300"
      )}>
        <TranslationProvider>
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem themes={['light', 'dark', 'retro', 'oled', 'non-binary']}>
            <header className="w-full p-4 sm:p-8 flex justify-between items-center gap-3 max-w-5xl mx-auto">
              <ThemeSelector />
              <p className="font-display text-lg font-extrabold leading-none sm:text-xl">(non)BinaryGames</p>
              <LanguageSelector />
            </header>
            <main className="flex-grow flex flex-col items-center justify-center w-full">
              {children}
            </main>
          </ThemeProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}