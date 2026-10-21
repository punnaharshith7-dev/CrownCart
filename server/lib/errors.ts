export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, "bad_request", message, details);
export const unauthorized = (message = "Please sign in to continue.") => new HttpError(401, "unauthorized", message);
export const forbidden = (message = "You do not have permission to do that.") => new HttpError(403, "forbidden", message);
export const notFound = (message = "Not found.") => new HttpError(404, "not_found", message);
export const conflict = (message: string, details?: unknown) => new HttpError(409, "conflict", message, details);
export const tooMany = (message = "Too many attempts. Please wait and try again.") =>
  new HttpError(429, "rate_limited", message);
export const unavailable = (message: string) => new HttpError(503, "not_configured", message);
