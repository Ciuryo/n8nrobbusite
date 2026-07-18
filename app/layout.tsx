import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Chakra_Petch,
  Press_Start_2P,
} from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PwaRegister from "@/components/PwaRegister";
import Toaster from "@/components/Toaster";
import GameFeelWatcher from "@/components/GameFeelWatcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display angular estilo HUD para títulos
const chakra = Chakra_Petch({
  weight: ["600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
});

// Fonte arcade 8-bit — usada com parcimônia nos números de XP
const arcade = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-arcade",
});

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "RobbuGameN8N",
  description:
    "Plataforma gamificada de treinamento em IA, RAG e orquestração de agentes no n8n",
  applicationName: "RobbuGameN8N",
  appleWebApp: {
    capable: true,
    title: "RobbuGameN8N",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: `${base}/icons/apple-touch-icon.png`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060910",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${chakra.variable} ${arcade.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <PwaRegister />
        <GameFeelWatcher />
        <Navbar />
        <main className="flex flex-1 flex-col">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
