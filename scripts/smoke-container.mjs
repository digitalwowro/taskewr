import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { config } from "dotenv";

config({ path: ".env.dev", quiet: true });

const image = process.env.TASKEWR_CONTAINER_IMAGE || "taskewr:container-smoke";
const containerName =
  process.env.TASKEWR_CONTAINER_NAME || `taskewr-container-smoke-${randomBytes(4).toString("hex")}`;
const port = process.env.TASKEWR_CONTAINER_PORT || "3010";
const baseUrl = process.env.TASKEWR_CONTAINER_BASE_URL || `http://127.0.0.1:${port}`;
const healthAttempts = Number.parseInt(process.env.TASKEWR_CONTAINER_HEALTH_ATTEMPTS || "80", 10);
const healthIntervalMs = Number.parseInt(process.env.TASKEWR_CONTAINER_HEALTH_INTERVAL_MS || "1500", 10);
const dockerArgs = (process.env.TASKEWR_CONTAINER_DOCKER_ARGS || "")
  .split(/\s+/)
  .map((value) => value.trim())
  .filter(Boolean);
const hasCustomNetwork = dockerArgs.includes("--network") || dockerArgs.some((arg) => arg.startsWith("--network="));
const databaseUrl =
  process.env.TASKEWR_CONTAINER_DATABASE_URL ||
  process.env.DATABASE_URL?.replace("@localhost:", "@host.docker.internal:").replace("@127.0.0.1:", "@host.docker.internal:");
const sessionSecret =
  process.env.TASKEWR_CONTAINER_SESSION_SECRET ||
  process.env.SESSION_SECRET ||
  "container-smoke-session-secret-that-is-long-enough";

if (!databaseUrl) {
  throw new Error("DATABASE_URL or TASKEWR_CONTAINER_DATABASE_URL is required for container smoke.");
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
      ...options,
    });
    let stdout = "";
    let stderr = "";

    if (options.capture) {
      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with ${code}\n${stdout}\n${stderr}`));
    });
  });
}

async function cleanup() {
  await run("docker", ["rm", "-f", containerName], { capture: true }).catch(() => {});
}

async function waitForHealth() {
  let lastError = null;
  const attempts = Number.isFinite(healthAttempts) && healthAttempts > 0 ? healthAttempts : 80;
  const intervalMs = Number.isFinite(healthIntervalMs) && healthIntervalMs > 0 ? healthIntervalMs : 1500;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/health`);

      if (response.ok) {
        console.log(`container smoke ok: ${await response.text()}`);
        return;
      }

      lastError = new Error(`health returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw lastError ?? new Error(`container health check timed out after ${attempts} attempts`);
}

async function main() {
  await cleanup();

  const args = [
    "run",
    "--rm",
    "--detach",
    "--name",
    containerName,
    ...dockerArgs,
  ];

  if (!hasCustomNetwork) {
    args.push("-p", `${port}:3000`);
  }

  args.push(
    "-e",
    "NODE_ENV=production",
    "-e",
    "PORT=3000",
    "-e",
    `APP_URL=${baseUrl}`,
    "-e",
    `DATABASE_URL=${databaseUrl}`,
    "-e",
    `SESSION_SECRET=${sessionSecret}`,
    image,
  );

  try {
    await run("docker", args);
    await waitForHealth();
  } catch (error) {
    console.error(error);
    const logs = await run("docker", ["logs", containerName], { capture: true }).catch(() => null);

    if (logs?.stdout || logs?.stderr) {
      console.error(logs.stdout);
      console.error(logs.stderr);
    }

    process.exitCode = 1;
  } finally {
    await cleanup();
  }
}

main();
