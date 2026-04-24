import { verifyCsrfToken } from "@/lib/csrf";

export function assertValidCsrfToken(request: Request) {
  verifyCsrfToken(request);
}
