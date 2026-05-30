import { io, Socket } from "socket.io-client";
import { env } from "@/lib/env";
import { APPLICATION_UPDATED_EVENT } from "@/shared/socket/applicationEvents";

let socket: Socket | null = null;
let refCount = 0;

const createSocket = (): Socket =>
  io(env.socketUrl, {
    path: "/socket.io",
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    autoConnect: true,
  });

export const acquireApplicationSocket = (): Socket | null => {
  refCount += 1;

  if (!socket) {
    socket = createSocket();
    return socket;
  }

  if (socket.disconnected) {
    socket.connect();
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
