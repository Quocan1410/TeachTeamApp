/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/uploads/**",
      },
    ],
  },
  // Temporarily disable React Strict Mode to prevent WebSocket double-mounting in development
  // This eliminates console errors from WebSocket connections being created/destroyed twice
  reactStrictMode: false,

  // Moved from experimental.serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: ["typeorm"],

  // Development-specific configuration to reduce HMR issues
  ...(process.env.NODE_ENV === "development" && {
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Improve HMR reliability
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        };

        // Reduce HMR chunk errors
        config.optimization = {
          ...config.optimization,
          runtimeChunk: "single",
        };
      }
      return config;
    },

    // Reduce fast refresh sensitivity
    experimental: {
      esmExternals: "loose",
    },
  }),
};

module.exports = nextConfig;
