import { spawn } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.dev" });

const databaseUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to reset a database while NODE_ENV=production.");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Create .env.dev or export DATABASE_URL first.");
}

const { hostname } = new URL(databaseUrl);
const allowedHosts = new Set(["localhost", "127.0.0.1", "::1", "db"]);

if (!allowedHosts.has(hostname)) {
  throw new Error(`Refusing to reset non-local database host: ${hostname}`);
}

console.log("Resetting the local development database...");

const child = spawn("npx", ["prisma", "migrate", "reset", "--force"], {
  env: process.env,
  shell: true,
  stdio: "inherit",
});

child.on("exit", (code) => {
  if (code && code !== 0) {
    process.exit(code);
  }

  console.log("");
  console.log("Local database reset complete.");
  console.log("If the browser was already logged in, run Logout or clear localhost cookies before testing.");
});
