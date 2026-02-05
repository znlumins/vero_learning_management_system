import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VERO - AI Powered Learning Assistant",
  description: "VeroApp adalah asisten pembelajaran bertenaga AI yang dirancang untuk membantu mahasiswa dan dosen dalam proses belajar mengajar. Dengan fitur-fitur inovatif seperti terjemahan bahasa isyarat, speech-to-text, dan papan tulis digital, VeroApp memudahkan komunikasi dan kolaborasi di lingkungan akademik.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
