import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { buildSchema } from "type-graphql";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import cors from "cors";
import session from "express-session";
import { config } from "dotenv";
import { initializeDatabase } from "./config/database";
import { AuthResolver } from "./resolvers/AuthResolver";
import { UserResolver } from "./resolvers/UserResolver";
import { CourseResolver } from "./resolvers/CourseResolver";
import { ReportResolver } from "./resolvers/ReportResolver";
import { SubscriptionResolver } from "./resolvers/SubscriptionResolver";
import { NotificationResolver } from "./resolvers/NotificationResolver";
import "./types/session";
import path from "path";

// Load environment variables from root .env file
config({ path: path.resolve(__dirname, "../../.env") });

async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();

        // Create Express app
        const app = express();

        // Session configuration
        app.use(
            session({
                secret:
                    process.env.ADMIN_SESSION_SECRET ||
                    process.env.SESSION_SECRET ||
                    "admin-session-secret",
                resave: false,
                saveUninitialized: false,
                cookie: {
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                },
            })
        );

        // Build GraphQL schema
        const schema = await buildSchema({
            resolvers: [
                AuthResolver,
                UserResolver,
                CourseResolver,
                ReportResolver,
                SubscriptionResolver,
                NotificationResolver,
            ],
            validate: false,
            pubSub: require("./config/pubsub").pubsub,
        });

        // Create HTTP server
        const httpServer = createServer(app);

        // Create WebSocket server
        const wsServer = new WebSocketServer({
            server: httpServer,
            path: "/graphql",
        });

        // WebSocket connection handling
        wsServer.on("connection", (ws, req) => {
            ws.on("error", (error) => {
                // Silent error handling for production
            });
        });

        // Save the returned server's info so we can shutdown this server later
        const serverCleanup = useServer(
            {
                schema,
                onConnect: (ctx) => {
                    return true;
                },
                onDisconnect: (ctx, code, reason) => {
                    // Silent disconnect handling
                },
                onSubscribe: (ctx, id, payload) => {
                    // Silent subscription handling
                },
            },
            wsServer
        );

        // Create Apollo Server
        const server = new ApolloServer({
            schema,
            introspection: true,
            plugins: [
                // Proper shutdown for the HTTP server.
                ApolloServerPluginDrainHttpServer({ httpServer }),
                // Proper shutdown for the WebSocket server.
                {
                    async serverWillStart() {
                        return {
                            async drainServer() {
                                await serverCleanup.dispose();
                            },
                        };
                    },
                },
            ],
        });

        await server.start();

        // Apply middleware
        app.use(
            "/graphql",
            cors<cors.CorsRequest>({
                origin: [
                    process.env.ADMIN_FRONTEND_URL ||
                        process.env.FRONTEND_URL ||
                        "http://localhost:3001",
                    process.env.FRONTEND_URL || "http://localhost:3000",
                    "http://localhost:3000", // Default Next.js port
                    "http://localhost:3001", // Alternative port
                    "http://localhost:3002", // Another alternative
                ],
                credentials: true,
            }),
            express.json(),
            expressMiddleware(server, {
                context: async ({ req, res }) => ({
                    req,
                    res,
                    user: req.session?.userId
                        ? { id: req.session.userId }
                        : null,
                }),
            })
        );

        // Health check endpoint
        app.get("/health", (req, res) => {
            res.json({
                status: "OK",
                service: "Admin GraphQL Backend",
                timestamp: new Date().toISOString(),
            });
        });

        // Start server
        const PORT = process.env.ADMIN_BACKEND_PORT || process.env.PORT || 4002;
        httpServer.listen(PORT, () => {
            // Server started successfully
        });
    } catch (error) {
        process.exit(1);
    }
}

startServer();
