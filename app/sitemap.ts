import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{
    url: "https://ticketflow.193.203.15.98.sslip.io/",
    lastModified: new Date("2026-08-20"),
    changeFrequency: "weekly",
    priority: 1,
  }];
}
