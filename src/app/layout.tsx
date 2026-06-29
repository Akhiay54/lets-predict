import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { HydrationProvider } from "@/components/shared/HydrationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FIFA Predict 2026 — World Cup Prediction League",
  description: "Predict the FIFA World Cup 2026 bracket. Create a league, invite friends, and compete on the leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-background text-foreground flex flex-col">
        <HydrationProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground/50">
            FIFA Predict 2026 · Not affiliated with FIFA · Built for fun
          </footer>
        </HydrationProvider>
      </body>
    </html>
  );
}
