import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "Los Hermanos | Comida Mexicana",
        template: "%s | Los Hermanos",
    },
    description:
        "Burritos, nachos, acompanhamentos e combos. Peça seu delivery Los Hermanos em Dracena/SP.",
    applicationName: "Los Hermanos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="pt-BR"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="flex min-h-full flex-col">
                {children}
                <Toaster />
            </body>
        </html>
    );
}
