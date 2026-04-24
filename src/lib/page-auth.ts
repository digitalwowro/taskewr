import { redirect } from "next/navigation";

import { AuthService } from "@/server/services/auth-service";

function sanitizeNextPath(nextPath: string) {
  if (!nextPath.startsWith("/")) {
    return "/";
  }

  if (nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}

export async function requireAuthenticatedPage(nextPath: string) {
  const authService = new AuthService();
  const actor = await authService.getAuthenticatedActor();

  if (!actor) {
    redirect(`/auth/login?next=${encodeURIComponent(sanitizeNextPath(nextPath))}`);
  }

  return actor;
}

export async function redirectAuthenticatedUser(defaultPath = "/") {
  const authService = new AuthService();
  const actor = await authService.getAuthenticatedActor();

  if (actor) {
    redirect(defaultPath);
  }
}

export function buildPathWithSearch(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
) {
  const nextQuery = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      nextQuery.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        nextQuery.append(key, item);
      }
    }
  }

  return `${pathname}${nextQuery.size ? `?${nextQuery.toString()}` : ""}`;
}
