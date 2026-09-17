import type { Metadata } from "next";
import { Inter, Fraunces, Great_Vibes } from "next/font/google";
import "./globals.css";
import PwaUpdater from "@/components/PwaUpdater";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const handwriting = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handwriting",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memory Lane",
  description: "A personal memory-archiving platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} ${handwriting.variable} font-sans antialiased text-slate-900 bg-[#f8f6f3]`}>
        <PwaUpdater />
        {children}
      </body>
    </html>
  );
}
