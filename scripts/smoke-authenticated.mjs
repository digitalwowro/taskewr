const BASE_URL = process.env.TASKEWR_BASE_URL || "http://127.0.0.1:3000";
const EMAIL = process.env.TASKEWR_SMOKE_EMAIL || "account@taskewr.com";
const PASSWORD = process.env.TASKEWR_SMOKE_PASSWORD || "taskewr";

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

  const cookie = setCookie.split(";")[0];
  const headers = {
    Cookie: cookie,
  };

  await expectStatus("/api/v1/auth/me", 200, { headers });
  await expectStatus("/api/v1/search?query=review", 200, { headers });
  await expectStatus("/", 200, { headers });
  await expectStatus("/projects/1", 200, { headers });
  await expectStatus("/tasks/145", 200, { headers });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
