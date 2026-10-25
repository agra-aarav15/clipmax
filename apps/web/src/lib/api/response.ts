import type { ApiErrorBody } from "@clipmax/shared";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { isAppError } from "./errors";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonError(error: unknown): NextResponse<ApiErrorBody> {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: error.issues,
        },
      },
      { status: 422 },
    );
  }

  console.error("[api] unhandled error", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
    { status: 500 },
  );
}

/** Wraps a route body so every thrown error becomes the standard envelope. */
export async function handleRoute(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    return jsonError(error);
  }
}
