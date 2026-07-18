import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { TranslationProvider } from "@/lib/i18n/TranslationContext";

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
                        {children}
                    </ThemeProvider>
                </TranslationProvider>
            </body>
        </html>
    );
}