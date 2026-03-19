import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ParticleBackground from "./components/ParticleBackground";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Belimo Sensor Monitor",
  description: "Belimo sensor dashboard — real-time monitoring and device management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body style={{ minHeight: '100%', background: 'var(--bg-primary)' }}>
        <ParticleBackground />
        <div style={{ position: 'relative', zIndex: 1, height: '100vh', overflow: 'hidden' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
