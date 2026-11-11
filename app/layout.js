import "./globals.css";
export const metadata = { title: "Fórum", description: "Salas de chat em tempo real" };
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem("theme")||"dark"}catch(e){}` }} /></head>
      <body>{children}</body>
    </html>
  );
}
