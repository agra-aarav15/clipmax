import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/public-env";

const PUBLIC_ROUTES = ["", "/privacy", "/terms", "/refund", "/support", "/status"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.appUrl.replace(/\/$/, "");
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${base}${route || "/"}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/support" || route === "/status" ? 0.6 : 0.4,
  }));
}
