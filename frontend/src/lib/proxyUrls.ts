import { env } from "@/lib/env";

/** Build an absolute WebSocket URL from a path (e.g. /admin-graphql) or pass through ws(s):// URLs. */
export function resolveWebSocketUrl(
  configured: string,
  fallbackPath = "/admin-graphql"
): string {
  const value = configured.trim();
  if (value.startsWith("ws://") || value.startsWith("wss://")) {
    return value;
  }

  if (typeof window === "undefined") {
    return value.startsWith("/")
      ? `ws://localhost:4002${value}`
      : value || "ws://localhost:4002/graphql";
  }

  const path = value.startsWith("/") ? value : fallbackPath;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}

export function resolveAdminGraphqlWsUrl(): string {
  return resolveWebSocketUrl(env.adminWs, "/admin-graphql");
}

export function resolveSocketIoOrigin(): string {
  if (env.socketUrl) {
    return env.socketUrl;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:5000";
}
