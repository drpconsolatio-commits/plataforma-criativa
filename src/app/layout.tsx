import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Plataforma Criativa | Gestão de Criativos",
  description:
    "Plataforma inteligente para controle de processos criativos de e-commerce com IA e automações.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className={styles.appShell}>
          <Sidebar />
          <main className={styles.mainContent}>{children}</main>
        </div>
      </body>
    </html>
  );
}
