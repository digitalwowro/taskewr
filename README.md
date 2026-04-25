# Taskewr

Taskewr is a **self-hosted task and project tracker** for people who want a clean, private workspace instead of a bloated SaaS stack.

Built for small teams, solo operators, homelab users, and companies that want **full control over their data**, Taskewr runs with Docker in minutes and gives you a modern, focused workflow without the overhead.

---

## ✨ Features

* Dashboard with overdue work, current work, and project-based views
* Projects with active and archived states
* Project detail pages with **list and board views**
* Drag-and-drop workflow between stages
* Tasks with subtasks, labels, priorities, due dates, and shareable URLs
* Project editing, archive/unarchive, and manual ordering
* Built-in authentication (private by default)
* Global search across tasks and projects
* Docker-first deployment

---

## 🚀 Quick Start

### Docker Compose (recommended)

```bash
mkdir taskewr && cd taskewr
curl -O https://raw.githubusercontent.com/digitalwowro/taskewr/main/deploy/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/digitalwowro/taskewr/main/deploy/.env.example
```

Edit `.env`:

```env
APP_URL="https://your-domain.com"
APP_PORT=3000

POSTGRES_DB="taskewr"
POSTGRES_USER="taskewr"
POSTGRES_PASSWORD="choose-a-strong-password"

DATABASE_URL="postgresql://taskewr:choose-a-strong-password@db:5432/taskewr?schema=public"
SESSION_SECRET="replace-with-a-long-random-secret"
```

Generate a strong session secret with:

```bash
openssl rand -base64 48
```

Start:

```bash
docker compose pull
docker compose up -d
```

Open:

```
http://YOUR_SERVER:3000
```

Default login:

```
account@taskewr.com / taskewr
```

---

## 🧱 Requirements

* Docker Engine 24+
* Docker Compose v2
* Linux server (or any Docker-capable machine)
* Reverse proxy recommended for production (HTTPS)

---

## 🐳 Alternative: Raw Docker

<details>
<summary>Click to expand</summary>

```bash
docker network create taskewr
docker volume create taskewr_postgres
docker volume create taskewr_uploads
```

```bash
docker run -d \
  --name taskewr-db \
  --network taskewr \
  -e POSTGRES_DB=taskewr \
  -e POSTGRES_USER=taskewr \
  -e POSTGRES_PASSWORD=choose-a-strong-password \
  -v taskewr_postgres:/var/lib/postgresql/data \
  postgres:16-alpine
```

```bash
docker run -d \
  --name taskewr-app \
  --network taskewr \
  -p 3000:3000 \
  -e APP_URL=http://localhost:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://taskewr:choose-a-strong-password@taskewr-db:5432/taskewr?schema=public \
  -e SESSION_SECRET=replace-with-a-long-random-secret \
  -v taskewr_uploads:/app/storage/uploads \
  ghcr.io/digitalwowro/taskewr:latest
```

</details>

---

## 🔐 Production Setup

Taskewr works behind any reverse proxy:

* Nginx / Nginx Proxy Manager
* Traefik
* Caddy
* Apache

Recommended:

* terminate HTTPS at the proxy
* forward traffic to the app container
* set `APP_URL` to your public domain

---

## 💾 Data Persistence

Make sure these volumes are persisted:

* `postgres_data` → database
* `app_uploads` → uploaded files

Without persistent volumes, data will be lost.

---

## 🔄 Updating

### Docker Compose

```bash
docker compose pull
docker compose up -d
```

### Raw Docker

Recreate the container with the latest image.

---

## 🧪 Local Development

In development, run Postgres in Docker and run the Next.js app locally with Node.

Requirements:

* Node.js 22+
* Docker Engine 24+
* Docker Compose v2

```bash
cp .env.dev.example .env.dev
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
set -a; source .env.dev; set +a
npm ci
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run dev
```

Open:

```
http://localhost:3000
```

Useful commands:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f db
docker compose --env-file .env.dev -f docker-compose.dev.yml down
set -a; source .env.dev; set +a
npm run lint
npm test
npm run build
npm run dev:reset
npm run smoke:container
npm run clean:macos
```

---

## 📚 Documentation

* [Architecture](./docs/architecture.md)
* [Implementation checklist](./docs/implementation-checklist.md)
* [Development guide](./docs/development.md)
* [Operator checklist](./docs/operator-checklist.md)
* [Repeat settings](./docs/recurrence.md)
* [Production deployment](./docs/production-deployment.md)
* [Release readiness](./docs/release-readiness.md)

---

## 🤝 Contributing

Contributions are welcome.

If you want to improve Taskewr — features, UX, bugs, or performance — feel free to open an issue or submit a PR.

---

## 📜 License

Taskewr is **source-available**:

* Free for personal, educational, research, and non-commercial use
* Free for evaluation and open-source usage
* Commercial use requires a support license

See [LICENSE.md](./LICENSE.md) for full details.
