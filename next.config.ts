/**
 * Next.js config: dev LAN origin allowlist for testing from other devices on the network.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.86.34"],
};

export default nextConfig;
