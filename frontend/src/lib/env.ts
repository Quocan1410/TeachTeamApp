/**
 * Client env — from root `.env` via next.config.js (NEXT_PUBLIC_* only).
 * Dev default: same-origin paths proxied by Next.js rewrites (Phase 5).
 */
const apiEndpoint =
  process.env.NEXT_PUBLIC_API_ENDPOINT?.trim() || "/api";

const apiOrigin =
  process.env.NEXT_PUBLIC_API_ORIGIN?.trim() ||
  (apiEndpoint.startsWith("/")
    ? ""
    : apiEndpoint.replace(/\/api\/?$/, "") || "http://localhost:5000");

export const env = {
  apiEndpoint,
  apiOrigin,
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || "",
  adminGraphql:
    process.env.NEXT_PUBLIC_ADMIN_GRAPHQL_ENDPOINT?.trim() ||
    "/admin-graphql",
  adminWs:
    process.env.NEXT_PUBLIC_ADMIN_WS_ENDPOINT?.trim() || "/admin-graphql",
  frontendUrl:
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
} as const;

export const resolveUploadUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!env.apiOrigin) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  return `${env.apiOrigin}${path.startsWith("/") ? path : `/${path}`}`;
};
