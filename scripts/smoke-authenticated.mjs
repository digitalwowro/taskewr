import { SMOKE_PROJECT_ID, SMOKE_TASK_ID } from "./smoke-constants.mjs";

const BASE_URL = process.env.TASKEWR_BASE_URL || "http://127.0.0.1:3000";
const EMAIL = process.env.TASKEWR_SMOKE_EMAIL || "admin@taskewr.com";
const PASSWORD = process.env.TASKEWR_SMOKE_PASSWORD || "admin";

async function expectStatus(path, status, init = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    ...init,
  });

  if (response.status !== status) {
    throw new Error(`${path} expected ${status} but received ${response.status}`);
  }

  console.log(`${path} ${response.status}`);
  return response;
}

async function main() {
  await expectStatus("/api/v1/health", 200);
  await expectStatus("/auth/login", 200);

  const login = await expectStatus("/api/v1/auth/login", 200, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    }),
  });

  const setCookie = login.headers.get("set-cookie");

  if (!setCookie) {
    throw new Error("Login response did not include a session cookie.");
  }

  const cookies = setCookie
    .split(/,(?=\s*[^;,]+=)/)
    .map((cookie) => cookie.split(";")[0].trim());
  const cookie = cookies.join("; ");
  const csrfCookie = cookies.find((item) => item.startsWith("taskewr_csrf="));

  if (!csrfCookie) {
    throw new Error("Login response did not include a CSRF cookie.");
  }

  const csrfToken = csrfCookie.slice("taskewr_csrf=".length);
  const headers = {
    Cookie: cookie,
    "x-csrf-token": csrfToken,
  };

  await expectStatus("/api/v1/auth/me", 200, { headers });
  await expectStatus("/api/v1/search?query=review", 200, { headers });
  await expectStatus("/", 200, { headers });
  await expectStatus(`/projects/${SMOKE_PROJECT_ID}`, 200, { headers });
  await expectStatus(`/tasks/${SMOKE_TASK_ID}`, 200, { headers });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
