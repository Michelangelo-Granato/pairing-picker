import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
