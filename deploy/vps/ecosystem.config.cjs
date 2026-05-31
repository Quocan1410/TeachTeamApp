/**
 * PM2 — run from repo root:  pm2 start deploy/vps/ecosystem.config.cjs
 * Requires: npm run build completed first.
 */
const path = require("path");
const root = path.resolve(__dirname, "../..");

module.exports = {
    apps: [
        {
            name: "teachteam-backend",
            cwd: path.join(root, "backend"),
            script: "dist/index.js",
            instances: 1,
            autorestart: true,
            max_memory_restart: "512M",
            env: { NODE_ENV: "production" },
        },
        {
            name: "teachteam-admin-backend",
            cwd: path.join(root, "admin-backend"),
            script: "dist/index.js",
            instances: 1,
            autorestart: true,
            max_memory_restart: "512M",
            env: { NODE_ENV: "production" },
        },
        {
            name: "teachteam-frontend",
            cwd: path.join(root, "frontend"),
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3000",
            instances: 1,
            autorestart: true,
            max_memory_restart: "768M",
            env: { NODE_ENV: "production" },
        },
        {
            name: "teachteam-admin-frontend",
            cwd: path.join(root, "admin-frontend"),
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3001",
            instances: 1,
            autorestart: true,
            max_memory_restart: "512M",
            env: { NODE_ENV: "production" },
        },
    ],
};
