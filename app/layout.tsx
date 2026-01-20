import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Behörden-Klartext | Briefe verstehen",
  description:
    "Verstehen Sie Behördenbriefe sofort: OCR-Texterkennung und automatische Dringlichkeitsbewertung für deutsche amtliche Schreiben. 100% lokal in Ihrem Browser.",
  keywords: [
    "Behördenbrief",
    "Mahnung",
    "Vollstreckungsbescheid",
    "OCR",
    "Texterkennung",
    "amtliche Schreiben",
  ],
  authors: [{ name: "Behörden-Klartext" }],
  openGraph: {
    title: "Behörden-Klartext",
    description: "Amtliche Briefe verstehen leicht gemacht",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
