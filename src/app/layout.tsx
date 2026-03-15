import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LimaUP | Dashboard de Uptime",
  description: "Monitoreo en tiempo real de servicios globales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${geistMono.variable} font-mono antialiased overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
