import type { Metadata, Viewport } from "next";
import { Baloo_2, Geist_Mono, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { TranslationProvider } from "@/lib/i18n/TranslationContext";
import { FocusModeProvider } from "@/lib/focusMode";
import { SiteHeader } from "./components/site/SiteHeader";
import { SiteFooter } from "./components/site/SiteFooter";

// The face of everything that is read: plain and wide open, next to the round one of the titles.
const inter = Inter({
  variable: "--font-inter",
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
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "(non)BinaryGames",
  description: "Calm games to play together in real time. Open a room, share the link and pick a box.",
};

// Fixed to the width of the phone, so a page never opens wider than the screen.
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(inter.variable, geistMono.variable, baloo.variable, "h-full antialiased")}>
      <body className={cn(
        "min-h-full flex flex-col",
        "text-[var(--title-text)]",
        "transition-colors duration-300"
      )}>
        <TranslationProvider>
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem themes={['light', 'dark', 'retro', 'oled', 'non-binary']}>
            <FocusModeProvider>
              <SiteHeader />
              <main className="flex-grow flex flex-col items-center justify-center w-full">
                {children}
              </main>
              <SiteFooter />
            </FocusModeProvider>
          </ThemeProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}