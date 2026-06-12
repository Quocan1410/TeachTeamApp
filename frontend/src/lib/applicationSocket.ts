import { io, Socket } from "socket.io-client";
import { env } from "@/lib/env";
import { resolveSocketIoOrigin } from "@/lib/proxyUrls";
import { APPLICATION_UPDATED_EVENT } from "@/shared/socket/applicationEvents";

let socket: Socket | null = null;
let refCount = 0;

async function fetchSocketToken(): Promise<string | null> {
  try {
    const response = await fetch(`${env.apiEndpoint}/auth/socket-token`, {
      credentials: "include",
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as {
      success?: boolean;
      data?: { token?: string };
    };
    return payload.data?.token?.trim() || null;
  } catch {
    return null;
  }
}

const createSocket = (): Socket => {
  const instance = io(resolveSocketIoOrigin(), {
    path: "/socket.io",
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    autoConnect: false,
  });

  void fetchSocketToken().then((token) => {
    if (token) {
      instance.auth = { token };
    }
    if (!instance.connected) {
      instance.connect();
    }
  });

  instance.on("connect_error", (error) => {
    console.error("Application socket connect error:", error.message);
  });

  instance.io.on("reconnect_attempt", () => {
    void fetchSocketToken().then((token) => {
      if (token) {
        instance.auth = { token };
      }
    });
  });

  return instance;
};

export const acquireApplicationSocket = (): Socket | null => {
  refCount += 1;

  if (!socket) {
    socket = createSocket();
    return socket;
  }

  if (socket.disconnected) {
    void fetchSocketToken().then((token) => {
      if (token) {
        socket!.auth = { token };
      }
      socket!.connect();
    });
  }

  return socket;
};

export const releaseApplicationSocket = (): void => {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0 || !socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

export { APPLICATION_UPDATED_EVENT };
