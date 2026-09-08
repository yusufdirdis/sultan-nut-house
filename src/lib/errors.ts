/**
 * Safe, customer-facing error handling. Never let raw ORM/DB/provider errors
 * (e.g. Prisma error codes, Stripe internals) reach the client — log the real
 * cause server-side and surface a generic, actionable message instead.
 */
export class AppError extends Error {
  readonly userMessage: string;
  readonly code: string;

  constructor(userMessage: string, code = "APP_ERROR", cause?: unknown) {
    super(userMessage);
    this.name = "AppError";
    this.userMessage = userMessage;
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

export function toSafeError(error: unknown, fallback = "Something went wrong. Please try again."): AppError {
  if (error instanceof AppError) return error;

  console.error("[unhandled-error]", error);
  return new AppError(fallback, "INTERNAL_ERROR", error);
}
