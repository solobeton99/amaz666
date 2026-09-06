import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/language";

export const metadata: Metadata = {
  title: "QR Code Manager",
  description: "Generate QR codes for locations and numbers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
