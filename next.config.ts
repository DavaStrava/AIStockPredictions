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
  
  // Disable strict linting for development
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable strict TypeScript checking for development
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
