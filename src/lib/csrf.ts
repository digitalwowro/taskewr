import { randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { AuthorizationError } from "@/domain/common/errors";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf-constants";

const CSRF_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export function createCsrfToken() {
  return randomBytes(32).toString("base64url");
}

export function verifyCsrfToken(request: Request) {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = parseCookieHeader(request.headers.get("cookie") ?? "").get(CSRF_COOKIE_NAME);

  if (!headerToken || !cookieToken) {
    throw new AuthorizationError("CSRF token is required.", "csrf_token_required");
  }

  const headerBuffer = Buffer.from(headerToken);
  const cookieBuffer = Buffer.from(cookieToken);

  if (headerBuffer.length !== cookieBuffer.length || !timingSafeEqual(headerBuffer, cookieBuffer)) {
    throw new AuthorizationError("CSRF token is invalid.", "csrf_token_invalid");
  }
}

export async function setCsrfCookie(token = createCsrfToken()) {
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CSRF_MAX_AGE_SECONDS,
  });

  return token;
}

export async function clearCsrfCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
}

function parseCookieHeader(header: string) {
  const cookies = new Map<string, string>();

  for (const cookie of header.split(";")) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");
    const rawValue = rawValueParts.join("=");

    if (!rawName || !rawValue) {
      continue;
    }

    cookies.set(rawName, decodeURIComponent(rawValue));
  }

  return cookies;
}
