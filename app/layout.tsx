import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import "@/templates/newsmag/newsmag.css";
import "@/templates/magazine/magazine.css";
import "@/templates/newsy/newsy.css";
import "@/templates/hotnewsy/hotnewsy.css";
import "@/templates/hotmagazine/hotmagazine.css";
import "@/templates/classicmagazine/classicmagazine.css";
import "@/templates/gamerworld/gamerworld.css";
import "@/templates/pennnews/pennnews.css";
import "@/templates/lifestyle/lifestyle.css";

const metadataBase = process.env.PUBLIC_BASE_URL
  ? new URL(process.env.PUBLIC_BASE_URL)
  : process.env.NODE_ENV === "production"
    ? undefined
    : new URL("http://localhost:3000");

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
  title: {
    default: "Signal Library | Research for better decisions",
    template: "%s | Signal Library",
  },
  description:
    "Explore practical research, industry briefings, and evidence-led guides for modern teams.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
        <Toaster position="bottom-right" richColors theme="light" />
      </body>
    </html>
  );
}
