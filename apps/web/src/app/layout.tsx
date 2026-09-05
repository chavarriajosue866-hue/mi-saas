import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers"; // <-- Importamos el wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS Dashboard",
  description: "Multi-tenant SaaS Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers> {/* <-- Aquí lo usamos */}
          {children}
        </Providers>
      </body>
    </html>
  );
}