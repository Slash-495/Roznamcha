import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roznamcha CRM",
  description: "Phase 1 CRM for Shree Ji Bartan Bhandar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-screen overflow-hidden bg-gray-50/50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="mx-auto max-w-6xl p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
