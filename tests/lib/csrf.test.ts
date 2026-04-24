import test from "node:test";
import assert from "node:assert/strict";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf-constants";
import { verifyCsrfToken } from "@/lib/csrf";

function createRequest(headerToken?: string, cookieToken?: string) {
  const headers = new Headers();

  if (headerToken) {
    headers.set(CSRF_HEADER_NAME, headerToken);
  }

  if (cookieToken) {
    headers.set("cookie", `${CSRF_COOKIE_NAME}=${cookieToken}`);
  }

  return new Request("http://localhost/api", {
    method: "POST",
    headers,
  });
}

test("verifyCsrfToken accepts matching header and cookie tokens", () => {
  assert.doesNotThrow(() => verifyCsrfToken(createRequest("token", "token")));
});

test("verifyCsrfToken rejects missing and mismatched tokens", () => {
  assert.throws(() => verifyCsrfToken(createRequest()), /CSRF token is required/);
  assert.throws(() => verifyCsrfToken(createRequest("one", "two")), /CSRF token is invalid/);
});
