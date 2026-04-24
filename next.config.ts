import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: {
    position: "bottom-right",
  },
  output: "standalone",
};

export default nextConfig;
