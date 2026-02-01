import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Improve error handling and debugging
  reactStrictMode: true,

  // Fix Turbopack workspace root detection
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Better error reporting
  experimental: {
    // Enable better error overlay
    optimizePackageImports: ['recharts', 'simple-statistics', 'lucide-react', 'date-fns'],
  },

  // Ensure proper hydration
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Webpack configuration for code splitting (production builds)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer && config.optimization) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...(typeof config.optimization.splitChunks === 'object'
            ? config.optimization.splitChunks?.cacheGroups
            : {}),
          // Split Recharts into separate chunk (~450KB)
          recharts: {
            test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
            name: 'recharts',
            chunks: 'all',
            priority: 20,
          },
          // Split date-fns into separate chunk
          dateFns: {
            test: /[\\/]node_modules[\\/]date-fns[\\/]/,
            name: 'date-fns',
            chunks: 'all',
            priority: 15,
          },
          // Common vendor chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
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
