/**
 * Centralized client env — values from root `.env` via next.config.js
 * (NEXT_PUBLIC_* only; never put secrets here).
 */
const apiEndpoint =
  process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:5000/api";

export const env = {
  apiEndpoint,
  apiOrigin:
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    apiEndpoint.replace(/\/api\/?$/, "") ||
    "http://localhost:5000",
  socketUrl:
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    "http://localhost:5000",
  adminGraphql:
    process.env.NEXT_PUBLIC_ADMIN_GRAPHQL_ENDPOINT ||
    "http://localhost:4002/graphql",
  adminWs:
    process.env.NEXT_PUBLIC_ADMIN_WS_ENDPOINT ||
    "ws://localhost:4002/graphql",
  frontendUrl:
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
} as const;

export const resolveUploadUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${env.apiOrigin}${path.startsWith("/") ? path : `/${path}`}`;
};
