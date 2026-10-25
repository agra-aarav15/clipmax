import { API_ERROR_CODES, type ApiErrorCode } from "@clipmax/shared";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  PLAN_LIMIT_REACHED: 403,
  INSUFFICIENT_CREDITS: 402,
  UPLOAD_NOT_FOUND: 409,
  UPLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNSUPPORTED_SOURCE: 422,
  PROJECT_NOT_READY: 409,
  RENDER_IN_PROGRESS: 409,
  RATE_LIMITED: 429,
  CONFIGURATION_ERROR: 503,
  INTERNAL_ERROR: 500,
  NOT_IMPLEMENTED: 501,
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details: unknown;

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: { status?: number; details?: unknown; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.status = options?.status ?? STATUS_BY_CODE[code];
    this.details = options?.details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function assertNeverCode(code: never): never {
  // Compile-time exhaustiveness guard for API_ERROR_CODES consumers.
  throw new Error(`Unhandled API error code: ${String(code)}`);
}

export { API_ERROR_CODES };
