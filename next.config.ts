import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Improve error handling and debugging
  reactStrictMode: true,
  
  // Better error reporting
  experimental: {
    // Enable better error overlay
    optimizePackageImports: ['recharts', 'simple-statistics'],
  },
  
  // Ensure proper hydration
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
};

export default nextConfig;
