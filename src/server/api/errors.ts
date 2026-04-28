import {
  AuthenticationError,
  AuthorizationError,
  DomainError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "@/domain/common/errors";
import { ZodError } from "zod";

function formatZodMessage(error: ZodError) {
  return error.issues[0]?.message ?? "Validation failed.";
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json({ error: formatZodMessage(error), code: "validation_error" }, { status: 400 });
  }

  if (error instanceof ValidationError) {
    return Response.json({ error: error.message, code: error.code }, { status: 400 });
  }

  if (error instanceof NotFoundError) {
    return Response.json({ error: error.message, code: error.code }, { status: 404 });
  }

  if (error instanceof AuthenticationError) {
    return Response.json({ error: error.message, code: error.code }, { status: 401 });
  }

  if (error instanceof AuthorizationError) {
    return Response.json({ error: error.message, code: error.code }, { status: 403 });
  }

  if (error instanceof RateLimitError) {
    return Response.json({ error: error.message, code: error.code }, { status: 429 });
  }

  if (error instanceof DomainError) {
    return Response.json({ error: error.message, code: error.code }, { status: 422 });
  }

  console.error(error);
  return Response.json({ error: "Internal server error", code: "internal_error" }, { status: 500 });
}
