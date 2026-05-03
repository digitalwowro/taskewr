"use client";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf-constants";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.method && init.method !== "GET" && init.method !== "HEAD") {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);

    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; code?: string }
      | null;
    throw new ApiRequestError(payload?.error ?? "Request failed.", response.status, payload?.code);
  }

  return response.json() as Promise<T>;
}

export async function requestFormData<T>(
  input: RequestInfo | URL,
  formData: FormData,
  init?: Omit<RequestInit, "body" | "method">,
): Promise<T> {
  const headers = new Headers(init?.headers);
  const csrfToken = readCookie(CSRF_COOKIE_NAME);

  if (csrfToken) {
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }

  const response = await fetch(input, {
    ...init,
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; code?: string }
      | null;
    throw new ApiRequestError(payload?.error ?? "Request failed.", response.status, payload?.code);
  }

  return response.json() as Promise<T>;
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiRequestError && error.status === 401;
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  return (
    document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}
