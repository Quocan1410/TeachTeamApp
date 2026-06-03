const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mainApiOrigin =
  process.env.MAIN_API_ORIGIN ||
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  "http://localhost:5000";
const adminGraphqlOrigin =
  process.env.ADMIN_GRAPHQL_ORIGIN || "http://localhost:4002";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${mainApiOrigin}/api/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${mainApiOrigin}/socket.io/:path*`,
      },
      {
        source: "/admin-graphql",
        destination: `${adminGraphqlOrigin}/graphql`,
      },
      {
        source: "/uploads/:path*",
        destination: `${mainApiOrigin}/uploads/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
    NEXT_PUBLIC_API_ORIGIN: process.env.NEXT_PUBLIC_API_ORIGIN,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
    NEXT_PUBLIC_ADMIN_GRAPHQL_ENDPOINT:
      process.env.NEXT_PUBLIC_ADMIN_GRAPHQL_ENDPOINT,
    NEXT_PUBLIC_ADMIN_WS_ENDPOINT: process.env.NEXT_PUBLIC_ADMIN_WS_ENDPOINT,
  },
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

  // Faster dev rebuilds: avoid polling (slow on Windows/OneDrive) unless needed
  ...(process.env.NODE_ENV === "development" &&
    process.env.WATCHPACK_POLLING === "true" && {
      webpack: (config, { dev, isServer }) => {
        if (dev && !isServer) {
          config.watchOptions = {
            poll: 1000,
            aggregateTimeout: 300,
          };
        }
        return config;
      },
    }),
};

module.exports = nextConfig;
