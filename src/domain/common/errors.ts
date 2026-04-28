export class DomainError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, code = "validation_error") {
    super(message, code);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, code = "not_found") {
    super(message, code);
    this.name = "NotFoundError";
  }
}

export class AuthenticationError extends DomainError {
  constructor(message: string, code = "authentication_error") {
    super(message, code);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string, code = "authorization_error") {
    super(message, code);
    this.name = "AuthorizationError";
  }
}

export class RateLimitError extends DomainError {
  constructor(message: string, code = "rate_limited") {
    super(message, code);
    this.name = "RateLimitError";
  }
}
