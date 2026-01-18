import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // skip strict mode
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: false,
};

export default nextConfig;
