import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isServiceError } from "@/lib/services/service-error";

export function apiSuccess(data?: unknown, message?: string) {
  return NextResponse.json({ success: true, data, message });
}

export function apiError(
  message: string,
  status = 400,
  extras?: Record<string, unknown>,
) {
  return NextResponse.json({ success: false, message, ...extras }, { status });
}

export function apiErrorFromUnknown(
  error: unknown,
  fallbackMessage = "Request failed",
  defaultStatus = 500,
) {
  if (error instanceof ZodError) {
    return apiError(error.issues[0]?.message || fallbackMessage, 400, {
      code: "VALIDATION_ERROR",
    });
  }

  if (isServiceError(error)) {
    return apiError(error.message, error.status, {
      ...(error.code ? { code: error.code } : {}),
      ...(error.details ?? {}),
    });
  }

  if (error instanceof Error) {
    return apiError(error.message, defaultStatus);
  }

  return apiError(fallbackMessage, defaultStatus);
}
