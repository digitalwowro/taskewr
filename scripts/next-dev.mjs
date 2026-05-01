import { config } from "dotenv";

config({
  path: process.env.DOTENV_CONFIG_PATH,
  quiet: true,
});

process.argv = [
  process.argv[0],
  "next",
  "dev",
  "-H",
  "0.0.0.0",
];

await import("next/dist/bin/next");
