#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"

mkdir -p "$root/backend" "$root/frontend"

cat > "$root/backend/.env" <<'EOF'
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=e2e
DB_NAME=teachteamapp
DB_SSL=disable
DB_SYNC=true
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
BACKEND_JWT_SECRET=ci-user-jwt-secret-not-for-production
ADMIN_JWT_SECRET=ci-admin-jwt-secret-not-for-production
DEV_OPS_SECRET=ci-dev-ops
EOF

cat > "$root/frontend/.env" <<'EOF'
NEXT_PUBLIC_API_ENDPOINT=/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001
MAIN_API_ORIGIN=http://localhost:5000
ADMIN_GRAPHQL_ORIGIN=http://localhost:4002
EOF

echo "Starting user API"
(
  cd "$root/backend"
  node -r ts-node/register src/index.ts > "$root/user-api.log" 2>&1
) &
api_pid=$!

echo "Building user frontend"
(cd "$root/frontend" && npm run build)

ready=0
for _ in $(seq 1 60); do
  if curl -sf http://127.0.0.1:5000/health >/dev/null; then
    ready=1
    break
  fi
  sleep 2
done
if [ "$ready" != 1 ]; then
  echo "User API did not become healthy"
  cat "$root/user-api.log" || true
  kill "$api_pid" || true
  exit 1
fi

node "$root/e2e/ci/seed-user.mjs"

echo "Starting user frontend"
(
  cd "$root/frontend"
  npx next start -p 3000 > "$root/user-web.log" 2>&1
) &
web_pid=$!

ready=0
for _ in $(seq 1 60); do
  if curl -sf http://127.0.0.1:3000 >/dev/null; then
    ready=1
    break
  fi
  sleep 2
done
if [ "$ready" != 1 ]; then
  echo "User frontend did not start"
  cat "$root/user-web.log" || true
  kill "$api_pid" "$web_pid" || true
  exit 1
fi

status=0
(cd "$root/e2e" && npm run test:user) || status=$?

kill "$api_pid" "$web_pid" || true
exit "$status"
