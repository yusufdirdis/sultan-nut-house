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

function isPrismaForeignKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2003"
  );
}

export function toSafeError(error: unknown, fallback = "Something went wrong. Please try again."): AppError {
  if (error instanceof AppError) return error;

  console.error("[unhandled-error]", error);

  // Safety net for any foreign-key guard we haven't explicitly coded around
  // (e.g. a delete blocked by a record in an unexpected related table) — at
  // least explain *why* it failed instead of a fully generic message.
  if (isPrismaForeignKeyError(error)) {
    return new AppError("This can't be removed because something else still references it.", "FOREIGN_KEY_CONSTRAINT", error);
  }

  return new AppError(fallback, "INTERNAL_ERROR", error);
}
