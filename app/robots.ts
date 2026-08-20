import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: "https://ticketflow.193.203.15.98.sslip.io/sitemap.xml",
    host: "https://ticketflow.193.203.15.98.sslip.io",
  };
}
