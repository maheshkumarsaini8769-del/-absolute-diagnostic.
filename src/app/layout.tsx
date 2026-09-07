import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Absolute Diagnostic | NABL Accredited Diagnostic Lab",
    template: "%s | Absolute Diagnostic",
  },
  description:
    "Absolute Diagnostic Centre - NABL accredited diagnostic lab offering blood tests, health packages, home sample collection, and diagnostic services. Accurate results, trusted care.",
  keywords: [
    "diagnostic lab",
    "blood test",
    "health checkup",
    "pathology lab",
    "NABL accredited",
    "home sample collection",
    "health packages",
    "diagnostic centre",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Absolute Diagnostic",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A1628",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
