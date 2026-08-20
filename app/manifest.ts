import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TicketFlow",
    short_name: "TicketFlow",
    description: "Search events and continue to official ticketing providers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#111827",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
