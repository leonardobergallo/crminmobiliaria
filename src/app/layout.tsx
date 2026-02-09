import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inmobiliar en Equipo - Sistema de Gestión Inmobiliaria",
  description: "Sistema completo de administración inmobiliaria con importación automática, búsqueda inteligente y gestión de clientes.",
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
