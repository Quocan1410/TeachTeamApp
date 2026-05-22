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
        ],
    },
    env: {
        GRAPHQL_ENDPOINT:
            process.env.NEXT_PUBLIC_ADMIN_GRAPHQL_ENDPOINT ||
            process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
            "http://localhost:4002/graphql",
    },
};

module.exports = nextConfig;
