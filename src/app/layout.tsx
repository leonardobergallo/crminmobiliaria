import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Inmobiliario - Gestión para Inmobiliarias en Santa Fe",
  description: "Plataforma CRM diseñada para agentes inmobiliarios de Santa Fe, Argentina. Gestiona clientes, propiedades, búsquedas y comisiones en un solo lugar.",
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
