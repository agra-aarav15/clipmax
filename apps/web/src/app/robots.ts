import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/public-env";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.appUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/dashboard/", "/api/", "/auth/", "/signup"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
