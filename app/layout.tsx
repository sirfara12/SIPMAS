import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

// Konfigurasi Font bawaan Next.js
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata Aplikasi sesuai SKPL SIPMAS NK
export const metadata: Metadata = {
  title: "SIPMAS NK",
  description: "Sistem Pengaduan Masyarakat Kelurahan Ngemplakrejo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="id" 
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#0b0f19] text-white">
        {/* Penyedia Komponen Notifikasi Toast (Global) */}
        <Toaster position="top-center" reverseOrder={false} />
        
        {children}
      </body>
    </html>
  );
}