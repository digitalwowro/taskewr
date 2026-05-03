# Development Workflow

## Local App Loop

In development, Postgres runs in Docker and the app runs locally with Node.

For UI styling conventions when building or changing app modules, use the [Design System](./design-system.md).

1. Check if a .env.dev is already existing on location. If it exists, don't overwrite it.

2. If a .env.dev file is not on location, create a local env file:

```bash
cp .env.dev.example .env.dev
```

3. Start local services:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
```

This starts Postgres and Mailpit. Mailpit captures local development email:

```text
SMTP: localhost:1025
Inbox: http://localhost:8025
```

4. Install dependencies and prepare the database:

```bash
npm ci
DOTENV_CONFIG_PATH=.env.dev npm run prisma:generate
DOTENV_CONFIG_PATH=.env.dev npm run prisma:migrate:dev
DOTENV_CONFIG_PATH=.env.dev npm run prisma:seed
```

5. Start the app and notification worker locally:

```bash
DOTENV_CONFIG_PATH=.env.dev npm run dev:all
```

You can still run them separately if you need isolated logs:

```bash
DOTENV_CONFIG_PATH=.env.dev npm run dev
DOTENV_CONFIG_PATH=.env.dev npm run worker:notifications
```

6. Open:

```text
http://localhost:3000
```

For local network testing from another device, use the Mac's private IP address:

```bash
ipconfig getifaddr en0
```

Then open `http://<private-ip>:3000`. The dev server binds to `0.0.0.0`, and `next.config.ts` allows private-network origins for development-only access. Next.js expects hostnames only in `allowedDevOrigins`, not full URLs.

7. Log in with a seeded demo account:

```text
admin@taskewr.com / admin
user@taskewr.com / user
```

## Verification Commands

Run the current baseline checks locally:

```bash
npm run lint
DOTENV_CONFIG_PATH=.env.dev npm test
DOTENV_CONFIG_PATH=.env.dev npm run build:prod
```

Task due-time email reminders are sent by the notification worker. `DOTENV_CONFIG_PATH=.env.dev npm run dev:all` starts it alongside the app. In local development, Mailpit-delivered emails are visible at `http://localhost:8025`.

Task attachments are stored on local disk. Development defaults write them under `.taskewr/uploads/task-attachments`, which is gitignored. You can override the storage directory and upload limit with:

```text
TASK_ATTACHMENT_STORAGE_DIR
TASK_ATTACHMENT_MAX_BYTES
```

If local data or login sessions get tangled while developing, reset the local database:

```bash
DOTENV_CONFIG_PATH=.env.dev npm run dev:reset
```

After a reset, log out or clear cookies for `localhost` if the browser was already signed in.

## More

For production deployment and release checks, see [Operations](./operations.md).

For architecture and domain boundaries, see [Architecture](./architecture.md).
