import { AppError, isPrismaNotFoundError, toUserFacingError } from "@/lib/errors";

export async function withActionError<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (isPrismaNotFoundError(error)) {
      throw toUserFacingError(error);
    }
    console.error(`[${label}]`, error);
    throw toUserFacingError(error);
  }
}
