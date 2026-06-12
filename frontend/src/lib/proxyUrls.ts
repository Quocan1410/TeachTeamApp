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
    const wsBase = env.frontendUrl.replace(/^http/, "ws");
    const path = value.startsWith("/") ? value : fallbackPath;
    return `${wsBase}${path}`;
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
  if (env.apiOrigin) {
    return env.apiOrigin;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return env.frontendUrl;
}
