export class ServiceError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    status = 400,
    options?: {
      code?: string;
      details?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}
