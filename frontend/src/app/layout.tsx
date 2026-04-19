import type { Metadata } from "next";
import { Sora } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MortgageModeler",
  description: "PPOR vs Rentvesting comparison engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{let t=localStorage.getItem("theme");if(t==="arctic")document.documentElement.setAttribute("data-theme","arctic")}catch(e){}`,
          }}
        />
      </head>
      <body className={`${sora.variable} font-sans antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
