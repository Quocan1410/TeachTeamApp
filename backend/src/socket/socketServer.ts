import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyBackendToken } from "../config/jwtConfig";
import { corsOptions } from "../config/corsConfig";

export type SocketUser = {
    userId: number;
    email: string;
    userType: string;
};

let io: Server | null = null;

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
            const token =
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
