import "./globals.css";

export const metadata = {
  title: "Sistema de Apontamentos Industrial",
  description: "Dashboard para monitoramento e registro de desvios industriais",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
