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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lab-app-green.vercel.app'),
  title: {
    default: "Absolute Diagnostic | NABL Accredited Blood Test & Pathology Lab",
    template: "%s | Absolute Diagnostic Laboratory",
  },
  description:
    "Absolute Diagnostic - Leading NABL accredited pathology lab in Sikar & Rajasthan. Book blood tests, full body health checkups, home sample collection, and instant digital reports.",
  keywords: [
    "diagnostic lab near me",
    "blood test near me",
    "pathology lab in sikar",
    "best diagnostic centre rajasthan",
    "blood test home collection",
    "full body checkup packages",
    "NABL accredited lab",
    "CBC test price",
    "HbA1c diabetes test",
    "LFT KFT lipid profile test",
    "thyroid test home collection",
    "emergency night blood test",
    "online lab report download",
    "Absolute Diagnostic Centre",
    "pathology lab Jaipur Sikar",
    "doctor prescription upload lab"
  ],
  authors: [{ name: "Absolute Diagnostic Centre" }],
  creator: "Absolute Diagnostic",
  publisher: "Absolute Diagnostic",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://lab-app-green.vercel.app",
    siteName: "Absolute Diagnostic",
    title: "Absolute Diagnostic | NABL Accredited Pathology & Blood Test Lab",
    description: "Book blood tests and full body checkups online with doorstep home sample collection & verified reports in 24 hrs.",
    images: [
      {
        url: "/images/hero/hero-microscope.webp",
        width: 1200,
        height: 630,
        alt: "Absolute Diagnostic Laboratory",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Absolute Diagnostic | Best Pathology & Blood Test Lab",
    description: "Accurate blood testing, health packages, and home collection. NABL certified.",
    images: ["/images/hero/hero-microscope.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A1628",
  viewportFit: "cover",
};

import ZenuxsWidget from "@/components/ZenuxsWidget";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": "Absolute Diagnostic Centre",
    "alternateName": "Absolute Diagnostic Pathology Laboratory",
    "url": "https://lab-app-green.vercel.app",
    "logo": "https://lab-app-green.vercel.app/images/hero/hero-microscope.webp",
    "image": "https://lab-app-green.vercel.app/images/hero/hero-microscope.webp",
    "description": "NABL Accredited Medical Diagnostic Laboratory offering blood tests, health packages, and home sample collection.",
    "telephone": "+919876543210",
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Station Road, Near Medical College",
      "addressLocality": "Sikar",
      "addressRegion": "Rajasthan",
      "postalCode": "332001",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "27.6094",
      "longitude": "75.1399"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "07:00",
        "closes": "21:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Sunday"],
        "opens": "08:00",
        "closes": "14:00"
      }
    ],
    "medicalSpecialty": [
      "Pathology",
      "ClinicalBiochemistry",
      "Hematology",
      "Microbiology"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Diagnostic Pathology Tests & Health Packages",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "MedicalTest",
            "name": "Complete Blood Count (CBC)"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "MedicalTest",
            "name": "HbA1c Glycated Haemoglobin Test"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "MedicalTest",
            "name": "Liver Function Test (LFT)"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "MedicalTest",
            "name": "Kidney Function Test (KFT)"
          }
        }
      ]
    }
  };

  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`} data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
        <ZenuxsWidget />
      </body>
    </html>
  );
}
