import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all network IP access for development
  allowedDevOrigins: ['10.230.224.152', 'localhost'],
};

export default nextConfig;
