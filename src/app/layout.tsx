import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";

import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Operava — Custom software for landscaping companies",
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "custom software for landscaping companies",
    "landscaping software development",
    "custom CRM for landscaping companies",
    "landscaping business software",
    "custom field service software",
    "lawn care software development",
    "home service software development",
    "landscaping software integrations",
  ],
  authors: [{ name: site.legalName, url: site.url }],
  creator: site.legalName,
  publisher: site.legalName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    url: site.url,
    title: "Custom software for landscaping companies that have outgrown generic tools",
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom software for landscaping companies that have outgrown generic tools",
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#1e3a66",
  colorScheme: "light",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${site.url}/#organization`,
  name: site.legalName,
  alternateName: site.name,
  url: site.url,
  email: site.contactEmail,
  description: site.description,
  slogan: "Stop changing your business to fit your software.",
  areaServed: { "@type": "Country", name: "United States" },
  serviceType: "Custom software development",
  knowsAbout: [
    "Custom CRM development",
    "Field service scheduling software",
    "Landscaping business operations",
    "Estimating and quoting systems",
    "Customer portals",
    "QuickBooks and Stripe integrations",
    "Workflow automation",
  ],
  makesOffer: {
    "@type": "Offer",
    name: "Custom operating software for landscaping companies",
    priceSpecification: {
      "@type": "PriceSpecification",
      price: 6000,
      priceCurrency: "USD",
      valueAddedTaxIncluded: false,
      description: "Custom software projects start at $6,000.",
    },
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  url: site.url,
  name: site.name,
  publisher: { "@id": `${site.url}/#organization` },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
        {/*
          Marks the document as scripted before first paint, so multi-step
          forms can hide inactive panels without a flash — and show every
          panel when scripting is unavailable.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-navy-700 focus:px-4 focus:py-2.5 focus:text-white"
        >
          Skip to content
        </a>

        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />

        <script
          type="application/ld+json"
          // Static, author-controlled schema objects.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </body>
    </html>
  );
}
