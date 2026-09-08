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
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof window==='undefined')return;if(window.navigator&&window.navigator.sendBeacon){var _b=window.navigator.sendBeacon.bind(window.navigator);window.navigator.sendBeacon=function(u,d){try{var s=typeof u==='string'?u:(u&&u.url?u.url:'');if(s&&s.indexOf('aistudio.zenuxs.site')!==-1&&window.fetch){window.fetch(s,{method:'POST',body:d,keepalive:true,credentials:'omit',headers:{'Content-Type':'application/json'}}).catch(function(){});return true;}}catch(e){}return _b(u,d);};}if(window.fetch){var _f=window.fetch;window.fetch=function(r,i){try{var u=typeof r==='string'?r:(r&&r.url?r.url:'');if(u&&u.indexOf('aistudio.zenuxs.site')!==-1){i=i?Object.assign({},i,{credentials:'omit'}):{credentials:'omit'};}}catch(e){}return _f.call(this,r,i);};}})();`,
          }}
        />
        <script src="https://aistudio.zenuxs.site/inter/widget.js?token=zinter-fb425957bffe4f409ab622b5b57de195"></script>
      </body>
    </html>
  );
}
