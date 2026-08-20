import type { Metadata, Viewport } from "next";
import "./globals.css";

const productionUrl = "https://ticketflow.193.203.15.98.sslip.io";

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: {
    default: "TicketFlow | Find Events and Official Tickets",
    template: "%s | TicketFlow",
  },
  description: "Search current events by artist, venue or city and continue securely to the official ticketing provider.",
  applicationName: "TicketFlow",
  keywords: ["event tickets", "concert tickets", "live events", "event search", "official tickets"],
  authors: [{ name: "TicketFlow" }],
  creator: "TicketFlow",
  publisher: "TicketFlow",
  alternates: { canonical: "/" },
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: productionUrl,
    siteName: "TicketFlow",
    title: "TicketFlow | Find Events and Official Tickets",
    description: "Search current events and continue securely to the official ticketing provider.",
    images: [{ url: "/social-card.png", width: 1200, height: 630, alt: "TicketFlow event discovery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TicketFlow | Find Events and Official Tickets",
    description: "Search current events and continue securely to the official ticketing provider.",
    images: ["/social-card.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TicketFlow",
    url: productionUrl,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web",
    description: "Search current events and continue to official ticketing providers.",
  };

  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
