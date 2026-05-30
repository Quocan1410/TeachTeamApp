import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import cookie from "cookie";
import { verifyBackendToken } from "../config/jwtConfig";
import { corsOptions } from "../config/corsConfig";
import { AUTH_COOKIE_NAME } from "../utils/authCookie";

export type SocketUser = {
    userId: number;
    email: string;
    userType: string;
};

let io: Server | null = null;

/** Active socket count per authenticated user id */
const onlineConnectionCounts = new Map<number, number>();

export const PRESENCE_SUBSCRIBE_EVENT = "presence:subscribe";
export const PRESENCE_SYNC_EVENT = "presence:sync";
export const PRESENCE_CHANGED_EVENT = "presence:changed";

function isUserOnline(userId: number): boolean {
    return (onlineConnectionCounts.get(userId) ?? 0) > 0;
}

function markUserConnected(userId: number): void {
    const next = (onlineConnectionCounts.get(userId) ?? 0) + 1;
    onlineConnectionCounts.set(userId, next);
    if (next === 1) {
        io?.emit(PRESENCE_CHANGED_EVENT, { userId, online: true });
    }
}

function markUserDisconnected(userId: number): void {
    const current = onlineConnectionCounts.get(userId) ?? 0;
    if (current <= 1) {
        onlineConnectionCounts.delete(userId);
        io?.emit(PRESENCE_CHANGED_EVENT, { userId, online: false });
        return;
    }
    onlineConnectionCounts.set(userId, current - 1);
}

export const initSocketServer = (httpServer: HttpServer): Server => {
    const allowedOrigins =
        typeof corsOptions.origin === "function"
            ? [
                  process.env.FRONTEND_URL || "http://localhost:3000",
                  process.env.ADMIN_FRONTEND_URL || "http://localhost:3001",
              ]
            : (corsOptions.origin as string[]) || [];

    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
        path: "/socket.io",
    });

    io.use((socket, next) => {
        try {
            const parsedCookies = cookie.parse(
                (socket.handshake.headers.cookie as string) || ""
            );
            const token =
                parsedCookies[AUTH_COOKIE_NAME] ||
                (socket.handshake.auth?.token as string) ||
                (socket.handshake.headers.authorization as string)?.replace(
                    /^Bearer\s+/i,
                    ""
                );

            if (!token) {
                next(new Error("Authentication required"));
                return;
            }

            const payload = verifyBackendToken(token);
            (socket.data as { user: SocketUser }).user = {
                userId: payload.userId,
                email: payload.email,
                userType: payload.userType,
            };
            next();
        } catch {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const user = (socket.data as { user: SocketUser }).user;
        socket.join(`user:${user.userId}`);
        markUserConnected(user.userId);

        socket.on(
            PRESENCE_SUBSCRIBE_EVENT,
            (payload: { userIds?: number[] } | undefined) => {
                const ids = Array.isArray(payload?.userIds)
                    ? payload.userIds.filter(
                          (id): id is number =>
                              typeof id === "number" && Number.isFinite(id)
                      )
                    : [];
                socket.emit(PRESENCE_SYNC_EVENT, {
                    statuses: ids.map((userId) => ({
                        userId,
                        online: isUserOnline(userId),
                    })),
                });
            }
        );

        socket.on("disconnect", () => {
            markUserDisconnected(user.userId);
        });
    });

    return io;
};

export const getSocketServer = (): Server | null => io;

export const emitToUser = (
    userId: number,
    event: string,
    payload: unknown
): void => {
    io?.to(`user:${userId}`).emit(event, payload);
};
