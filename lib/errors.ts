export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Admin access required") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Record not found") {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export function isPrismaNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  );
}

export function toUserFacingError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (isPrismaNotFoundError(error)) return new NotFoundError();
  return new AppError("Something went wrong. Please try again.", "INTERNAL_ERROR", 500);
}
