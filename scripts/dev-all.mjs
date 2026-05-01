import { spawn } from "node:child_process";

const env = {
  ...process.env,
  DOTENV_CONFIG_PATH: process.env.DOTENV_CONFIG_PATH || ".env.dev",
};

const children = [
  spawn("npm", ["run", "dev"], {
    env,
    stdio: "inherit",
  }),
  spawn("npm", ["run", "worker:notifications"], {
    env,
    stdio: "inherit",
  }),
];

let stopping = false;

function stopAll(signal = "SIGTERM") {
  if (stopping) {
    return;
  }

  stopping = true;

  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill(signal);
    }
  }
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (!stopping) {
      stopAll();
      process.exitCode = code ?? (signal ? 1 : 0);
    }
  });
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
