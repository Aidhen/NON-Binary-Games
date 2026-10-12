import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
    title: "NONBinary Games | Sudoku", 
    description: "A fast, clean, and competitive Sudoku experience.",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning className={cn(geistSans.variable, geistMono.variable, "h-full antialiased")}>
            <body className={cn(
                "min-h-full flex flex-col",
                "bg-[var(--app-background)] text-[var(--title-text)]",
                "transition-colors duration-300"
            )}>
                <TranslationProvider>
                    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem themes={['light', 'dark', 'retro', 'oled', 'non-binary']}>
                        <header className="w-full p-4 sm:p-8 flex justify-between items-center max-w-5xl mx-auto">
                            <ThemeSelector />
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