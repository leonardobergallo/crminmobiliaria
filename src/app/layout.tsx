import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Inmobiliario",
  description: "Sistema de gestión inmobiliaria para agentes REMAX",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-50">
        {children}
      </body>
    </html>
  );
}
