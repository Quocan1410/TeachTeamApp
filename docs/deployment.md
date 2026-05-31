# Deployment guide — TeachTeamApp

## Targets

| Component | Production (recommended) | Alternative |
|-----------|------------------------|-------------|
| frontend | VPS `app.yourdomain.com` or Vercel | Netlify |
| backend | VPS `api.yourdomain.com` or Render | Railway |
| admin-frontend | VPS `admin.yourdomain.com` (optional) | Local only |
| admin-backend | Same VPS `:4002` or subdomain | Render |
| MySQL | Local VPS or managed DB | Railway MySQL |

**Recommended:** one VPS + domain + Nginx + PM2 + MySQL (simple demo and coursework submission).

---

## A. Full stack on VPS (recommended)

### A.1. VPS requirements

- Ubuntu 22.04+ (or equivalent)
- RAM ≥ 2 GB (4 GB recommended with MySQL + 4 Node processes)
- DNS `A` records pointing to the VPS IP  
  Example: `app.teachteam.vn`, `api.teachteam.vn`, `admin.teachteam.vn`

### A.2. Install software

```bash
sudo apt update && sudo apt install -y nginx mysql-server git build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Create the database:

```bash
sudo mysql -e "CREATE DATABASE teachteamapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'teachteam'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';"
sudo mysql -e "GRANT ALL ON teachteamapp.* TO 'teachteam'@'localhost'; FLUSH PRIVILEGES;"
```

### A.3. Clone & build

```bash
cd /var/www
sudo git clone <YOUR_REPO_URL> teachteamapp
sudo chown -R $USER:$USER teachteamapp
cd teachteamapp
cp deploy/vps/env.production.example .env
nano .env   # set domain, DB, secrets, SMTP
npm run install
npm run build
cd backend && npm run db:reset
```

### A.4. PM2

```bash
cd /var/www/teachteamapp
pm2 start deploy/vps/ecosystem.config.cjs
pm2 save
pm2 startup
```

Template: `deploy/vps/ecosystem.config.cjs`.

### A.5. Nginx + SSL

```bash
sudo cp deploy/vps/nginx.example.conf /etc/nginx/sites-available/teachteamapp
sudo ln -s /etc/nginx/sites-available/teachteamapp /etc/nginx/sites-enabled/
# Edit server_name and upstreams in the file
sudo nginx -t && sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d app.yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com
```

### A.6. Production environment (summary)

Replace `yourdomain.com` with your real domain:

```env
NODE_ENV=production
DB_HOST=127.0.0.1
FRONTEND_URL=https://app.yourdomain.com
ADMIN_FRONTEND_URL=https://admin.yourdomain.com
ALLOWED_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
NEXT_PUBLIC_API_ENDPOINT=https://api.yourdomain.com/api
NEXT_PUBLIC_API_ORIGIN=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_FRONTEND_URL=https://app.yourdomain.com
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

**Note:** Proxy admin GraphQL on a subdomain such as `admin-api.yourdomain.com` (see `nginx.example.conf`).

### A.7. Post-deploy checks

| Check | URL |
|-------|-----|
| API health | `https://api.yourdomain.com/health` |
| Main app | `https://app.yourdomain.com` |
| Admin | `https://admin.yourdomain.com` |
| Demo login | See README — seed accounts |

---

## B. Vercel (frontend) + Render (backend)

Use when you do not have a VPS.

### B.1. Vercel (frontend)

1. Import the GitHub repo.
2. **Root Directory:** `frontend`
3. **Framework:** Next.js
4. **Environment variables** (Production):

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_ENDPOINT` | `https://teachteam-api.onrender.com/api` |
| `NEXT_PUBLIC_API_ORIGIN` | `https://teachteam-api.onrender.com` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://teachteam-api.onrender.com` |
| `NEXT_PUBLIC_FRONTEND_URL` | `https://your-app.vercel.app` |

5. Next.js **≥ 15.2.9** (avoids Vercel CVE deploy blocks).

### B.2. Render (backend)

1. **New Web Service** → repo, root `backend`.
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. Env: all `DB_*`, `BACKEND_JWT_SECRET`, `FRONTEND_URL`, `ALLOWED_ORIGINS` (include Vercel URL), `SMTP_*` for password reset.

### B.3. MySQL

- Railway / PlanetScale / Render MySQL addon.
- Update `DB_HOST` (enable SSL in TypeORM `extra` if required).

### B.4. CORS

`ALLOWED_ORIGINS` must match browser origins **exactly** (no trailing slash):

```
https://your-app.vercel.app,https://admin.example.com
```

---

## C. Production security checklist

- [ ] Change `ADMIN_PASSWORD`, all `*_SECRET`, and `DB_PASSWORD`
- [ ] `NODE_ENV=production`
- [ ] Do not expose `db:reset` publicly
- [ ] HTTPS everywhere (Certbot / Vercel)
- [ ] Firewall: only 80, 443, SSH
- [ ] Configure SMTP for password reset emails

---

## D. Deployment is on your infrastructure

This repository includes configs and docs only. Run the commands in sections A/B on your VPS or cloud accounts. After deploy, verify CORS and `NEXT_PUBLIC_*` match your live URLs.
